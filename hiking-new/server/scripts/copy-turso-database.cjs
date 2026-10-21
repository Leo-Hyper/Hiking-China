#!/usr/bin/env node

const { createClient } = require("@libsql/client");

const INSERT_ORDER = [
  "users",
  "posts",
  "events",
  "comments",
  "comment_likes",
  "post_likes",
  "followers",
  "bookmarks",
  "search_index",
  "event_registrations",
];

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

function quoteIdentifier(value) {
  return `"${String(value).replace(/"/g, '""')}"`;
}

async function queryRows(client, sql, args = []) {
  const result = await client.execute({ sql, args });
  return result.rows || [];
}

async function countRows(client, table) {
  const rows = await queryRows(client, `SELECT COUNT(*) AS n FROM ${quoteIdentifier(table)}`);
  return Number(rows[0]?.n || 0);
}

async function listSchemaObjects(client, type) {
  return queryRows(
    client,
    `SELECT name, tbl_name AS tableName, sql
       FROM sqlite_master
      WHERE type = ?
        AND sql IS NOT NULL
        AND name NOT LIKE 'sqlite_%'
      ORDER BY CASE type WHEN 'table' THEN 0 WHEN 'index' THEN 1 ELSE 2 END, name`,
    [type],
  );
}

async function listTables(client) {
  return queryRows(
    client,
    `SELECT name, sql
       FROM sqlite_master
      WHERE type = 'table'
        AND name NOT LIKE 'sqlite_%'
      ORDER BY name`,
  );
}

async function tableColumns(client, table) {
  const rows = await queryRows(client, `PRAGMA table_info(${quoteIdentifier(table)})`);
  return rows.map((row) => String(row.name));
}

async function assertTargetEmpty(client) {
  const tables = await listTables(client);
  const nonEmpty = [];
  for (const table of tables) {
    const count = await countRows(client, table.name);
    if (count > 0) nonEmpty.push(`${table.name}=${count}`);
  }
  if (nonEmpty.length > 0) {
    throw new Error(`Target database already contains rows: ${nonEmpty.join(", ")}`);
  }
}

async function resetTarget(client) {
  const tables = await listTables(client);
  for (const table of tables) {
    await client.execute({ sql: `DROP TABLE ${quoteIdentifier(table.name)}`, args: [] });
  }
}

function orderedTables(tables) {
  const byName = new Map(tables.map((table) => [String(table.name), table]));
  const ordered = [];
  for (const name of INSERT_ORDER) {
    const table = byName.get(name);
    if (table) {
      ordered.push(table);
      byName.delete(name);
    }
  }
  ordered.push(...byName.values());
  return ordered;
}

async function createMissingSchema(target, tables) {
  const existing = new Set((await listTables(target)).map((row) => String(row.name)));
  for (const table of tables) {
    if (!existing.has(String(table.name))) {
      await target.execute({ sql: table.sql, args: [] });
      existing.add(String(table.name));
    }
  }
}

async function copyTable(source, target, table, columns) {
  const columnSql = columns.map(quoteIdentifier).join(", ");
  const placeholders = columns.map(() => "?").join(", ");
  const rows = await queryRows(source, `SELECT ${columnSql} FROM ${quoteIdentifier(table)}`);
  const insertSql = `INSERT INTO ${quoteIdentifier(table)} (${columnSql}) VALUES (${placeholders})`;
  const batchSize = 100;

  for (let index = 0; index < rows.length; index += batchSize) {
    const statements = rows.slice(index, index + batchSize).map((row) => ({
      sql: insertSql,
      args: columns.map((column) => row[column] ?? null),
    }));
    if (statements.length > 0) await target.batch(statements, "write");
  }

  return rows.length;
}

async function main() {
  const reset = process.argv.includes("--reset") || process.env.RESET_TARGET === "1";
  const source = createClient({
    url: requiredEnv("SOURCE_TURSO_URL"),
    authToken: requiredEnv("SOURCE_TURSO_TOKEN"),
  });
  const target = createClient({
    url: requiredEnv("TARGET_TURSO_URL"),
    authToken: requiredEnv("TARGET_TURSO_TOKEN"),
  });

  try {
    if (reset) {
      await resetTarget(target);
      console.log("Target database reset.");
    }
    await assertTargetEmpty(target);
    const tables = orderedTables(await listTables(source));
    await createMissingSchema(target, tables);

    const counts = {};
    for (const table of tables) {
      const tableName = String(table.name);
      const columns = await tableColumns(source, tableName);
      counts[tableName] = await copyTable(source, target, tableName, columns);
    }

    const indexes = await listSchemaObjects(source, "index");
    for (const index of indexes) {
      await target.execute({ sql: index.sql, args: [] });
    }

    const triggers = await listSchemaObjects(source, "trigger");
    for (const trigger of triggers) {
      await target.execute({ sql: trigger.sql, args: [] });
    }

    const verification = {};
    for (const table of tables) {
      const tableName = String(table.name);
      const targetCount = await countRows(target, tableName);
      if (targetCount !== counts[tableName]) {
        throw new Error(
          `Count mismatch for ${tableName}: source=${counts[tableName]} target=${targetCount}`,
        );
      }
      verification[tableName] = targetCount;
    }

    console.log("Turso database copy complete.");
    for (const [table, count] of Object.entries(verification)) {
      console.log(`  ${table.padEnd(24)} ${count}`);
    }
  } finally {
    source.close();
    target.close();
  }
}

main().catch((error) => {
  console.error(`[copy-turso] ${error.stack || error.message}`);
  process.exitCode = 1;
});
