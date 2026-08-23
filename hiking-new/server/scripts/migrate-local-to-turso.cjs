#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();

const TABLES = [
  "users",
  "posts",
  "comments",
  "comment_likes",
  "post_likes",
  "followers",
  "bookmarks",
  "search_index",
  "events",
  "event_registrations",
];

const DELETE_ORDER = [
  "event_registrations",
  "bookmarks",
  "comment_likes",
  "post_likes",
  "followers",
  "comments",
  "search_index",
  "events",
  "posts",
  "users",
];

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

const TABLE_ORDER = {
  followers: "follower_id, following_id",
};

function parseArgs(argv) {
  const options = {
    apply: false,
    check: false,
    includeTestPosts: false,
    from: path.join(__dirname, "..", "..", "data", "hikingchina.db"),
    backupDir: path.join(__dirname, "..", "..", "..", ".backup"),
    restore: "",
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--apply") options.apply = true;
    else if (arg === "--check") options.check = true;
    else if (arg === "--include-test-posts") options.includeTestPosts = true;
    else if (arg === "--from") options.from = path.resolve(argv[++i]);
    else if (arg === "--restore") options.restore = path.resolve(argv[++i]);
    else if (arg === "--help" || arg === "-h") options.help = true;
    else throw new Error(`Unknown option: ${arg}`);
  }

  return options;
}

function usage() {
  console.log(`
Import the local SQLite snapshot into Turso.

Environment variables:
  TURSO_DATABASE_URL   libsql://... (required for --check/--apply)
  TURSO_AUTH_TOKEN     Turso token  (required for --check/--apply)

Usage:
  node scripts/migrate-local-to-turso.cjs
  node scripts/migrate-local-to-turso.cjs --check
  TURSO_DATABASE_URL=... TURSO_AUTH_TOKEN=... node scripts/migrate-local-to-turso.cjs --apply

Options:
  --apply                Back up remote rows, replace them with local rows, and commit atomically.
  --check                Connect to Turso and compare row counts without writing.
  --from <path>          Source SQLite database (default: server/data/hikingchina.db).
  --include-test-posts   Keep the two local test posts published. By default their status becomes 0.
  --restore <file>       Restore a JSON backup produced by --apply.
`);
}

function openLocalDb(filename) {
  if (!fs.existsSync(filename)) {
    throw new Error(`SQLite database not found: ${filename}`);
  }
  const db = new sqlite3.Database(filename, sqlite3.OPEN_READONLY);
  return {
    all(sql, args = []) {
      return new Promise((resolve, reject) => {
        db.all(sql, args, (error, rows) => (error ? reject(error) : resolve(rows || [])));
      });
    },
    close() {
      return new Promise((resolve, reject) => db.close((error) => (error ? reject(error) : resolve())));
    },
  };
}

async function createRemoteClient() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  const isLocalFile = Boolean(url && url.startsWith("file:"));
  if (!url || (!authToken && !isLocalFile)) {
    throw new Error("Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN in the environment.");
  }
  if (!isLocalFile && !/^libsql:\/\//.test(url) && !/^https:\/\//.test(url)) {
    throw new Error("TURSO_DATABASE_URL must start with libsql://, https://, or file://");
  }
  const { createClient } = require("@libsql/client");
  return createClient(isLocalFile ? { url } : { url, authToken });
}

async function tableColumns(client, table) {
  const result = await client.execute(`PRAGMA table_info (${table})`);
  return new Set(result.rows.map((row) => String(row.name)));
}

async function queryRows(client, sql, args = []) {
  if (typeof client.all === "function") {
    return client.all(sql, args);
  }
  const result = await client.execute({ sql, args });
  return result.rows || [];
}

async function buildReferenceIds(client) {
  const definitions = [
    ["users", "id"],
    ["posts", "id"],
    ["comments", "id"],
    ["events", "id"],
  ];
  const refs = {};
  for (const [table, column] of definitions) {
    const rows = await queryRows(client, `SELECT "${column}" AS id FROM "${table}"`);
    refs[table] = new Set(rows.map((row) => Number(row.id)));
  }
  return refs;
}

function hasValidReferences(table, row, refs) {
  const number = (value) => Number(value);
  switch (table) {
    case "comments":
      return refs.posts.has(number(row.post_id))
        && refs.users.has(number(row.user_id))
        && (row.parent_id == null || refs.comments.has(number(row.parent_id)));
    case "comment_likes":
      return refs.comments.has(number(row.comment_id)) && refs.users.has(number(row.user_id));
    case "post_likes":
      return refs.posts.has(number(row.post_id)) && refs.users.has(number(row.user_id));
    case "followers":
      return refs.users.has(number(row.follower_id)) && refs.users.has(number(row.following_id));
    case "bookmarks":
      return refs.users.has(number(row.user_id)) && refs.posts.has(number(row.post_id));
    case "events":
      return refs.users.has(number(row.user_id));
    case "event_registrations":
      return refs.events.has(number(row.event_id)) && refs.users.has(number(row.user_id));
    default:
      return true;
  }
}

function removeOrphans(rows, table, refs) {
  return rows.filter((row) => hasValidReferences(table, row, refs));
}

async function loadLocalImportData(client, includeTestPosts) {
  const rawRows = {};
  const sourceColumns = {};
  const sourceCounts = {};

  for (const table of TABLES) {
    sourceColumns[table] = [...(await getTableColumns(client, table))].sort();
    rawRows[table] = await fetchRows(client, table, sourceColumns[table]);
    sourceCounts[table] = rawRows[table].length;
  }

  const refs = await buildReferenceIds(client);
  const rowsByTable = {};
  let excludedOrphans = 0;
  const accept = (table, rows) => {
    const valid = removeOrphans(rows, table, refs);
    excludedOrphans += rows.length - valid.length;
    return valid;
  };

  for (const table of ["users", "posts", "events"]) {
    rowsByTable[table] = accept(table, transformRows(rawRows[table], table, includeTestPosts));
  }

  const candidateComments = transformRows(rawRows.comments, "comments", includeTestPosts);
  const acceptedCommentIds = new Set();
  let changed = true;
  while (changed) {
    changed = false;
    for (const row of candidateComments) {
      const id = Number(row.id);
      if (acceptedCommentIds.has(id)) continue;
      const parentIsValid = row.parent_id == null || acceptedCommentIds.has(Number(row.parent_id));
      if (refs.posts.has(Number(row.post_id)) && refs.users.has(Number(row.user_id)) && parentIsValid) {
        acceptedCommentIds.add(id);
        changed = true;
      }
    }
  }
  refs.comments = acceptedCommentIds;
  rowsByTable.comments = candidateComments.filter((row) => acceptedCommentIds.has(Number(row.id)));
  excludedOrphans += candidateComments.length - rowsByTable.comments.length;

  for (const table of ["comment_likes", "post_likes", "followers", "bookmarks", "search_index", "event_registrations"]) {
    rowsByTable[table] = accept(table, transformRows(rawRows[table], table, includeTestPosts));
  }

  return { rowsByTable, sourceColumns, sourceCounts, excludedOrphans };
}

async function getTableColumns(client, table) {
  const rows = await queryRows(client, `PRAGMA table_info (${table})`);
  return new Set(rows.map((row) => String(row.name)));
}

async function inspectSchemas(local, remote) {
  const schemas = {};
  for (const table of TABLES) {
    const localColumns = await getTableColumns(local, table);
    const remoteColumns = await tableColumns(remote, table);
    const shared = [...localColumns].filter((name) => remoteColumns.has(name));
    if (shared.length === 0) {
      throw new Error(`${table} has no compatible columns between the databases.`);
    }
    schemas[table] = shared.sort();
  }
  return schemas;
}

async function fetchRows(client, table, columns) {
  const names = columns.map((name) => `"${name}"`).join(", ");
  const order = TABLE_ORDER[table] || "id";
  return queryRows(client, `SELECT ${names} FROM "${table}" ORDER BY ${order}`);
}

async function countRows(client) {
  const counts = {};
  for (const table of TABLES) {
    const rows = await queryRows(client, `SELECT COUNT(*) AS n FROM "${table}"`);
    counts[table] = Number(rows[0]?.n || 0);
  }
  return counts;
}

function transformRows(rows, table, includeTestPosts) {
  if (includeTestPosts || table !== "posts") return rows;
  const testIds = new Set([16, 20]);
  return rows.map((row) => (
    testIds.has(Number(row.id)) ? { ...row, status: 0 } : row
  ));
}

function transformedSearchIndexChanges(rows, includeTestPosts) {
  if (includeTestPosts) return [];
  const testRoutes = new Set(["/post/16", "/post/20"]);
  return rows.filter((row) => testRoutes.has(String(row.route)));
}

function makeInsertStatement(table, columns, row) {
  const names = columns.map((name) => `"${name}"`).join(", ");
  const placeholders = columns.map(() => "?").join(", ");
  return {
    sql: `INSERT INTO "${table}" (${names}) VALUES (${placeholders})`,
    args: columns.map((name) => row[name] ?? null),
  };
}

async function writeBackup(backupDir, remote, schemas) {
  await fs.promises.mkdir(backupDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filename = path.join(backupDir, `turso-preimport-${stamp}.json`);
  const backup = {
    created_at: new Date().toISOString(),
    tables: {},
  };
  for (const table of TABLES) {
    backup.tables[table] = await fetchRows(remote, table, schemas[table]);
  }
  await fs.promises.writeFile(filename, `${JSON.stringify(backup, null, 2)}\n`, "utf8");
  return filename;
}

async function restoreBackup(remote, filename) {
  const backup = JSON.parse(await fs.promises.readFile(filename, "utf8"));
  const statements = DELETE_ORDER.map((table) => ({ sql: `DELETE FROM "${table}"` }));
  for (const table of INSERT_ORDER) {
    const rows = backup.tables?.[table];
    if (!Array.isArray(rows)) throw new Error(`Backup is missing table: ${table}`);
    if (rows.length === 0) continue;
    const columns = Object.keys(rows[0]).sort();
    rows.forEach((row) => statements.push(makeInsertStatement(table, columns, row)));
  }
  await remote.batch(statements, "write");
  return countRows(remote);
}

function printCounts(label, counts) {
  console.log(`\n${label}`);
  for (const [table, count] of Object.entries(counts)) {
    console.log(`  ${table.padEnd(22)} ${count}`);
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    usage();
    return;
  }

  if (options.restore) {
    if (!options.apply) throw new Error("Restore is destructive; add --apply.");
    const remote = await createRemoteClient();
    try {
      const counts = await restoreBackup(remote, options.restore);
      printCounts("Restored remote counts", counts);
    } finally {
      remote.close();
    }
    return;
  }

  const local = openLocalDb(options.from);
  let remote = null;

  try {
    const testData = {};
    const importData = await loadLocalImportData(local, options.includeTestPosts);
    testData.hiddenRoutes = transformedSearchIndexChanges(
      importData.rowsByTable.search_index,
      options.includeTestPosts,
    ).map((row) => row.route);
    testData.unpublishedTests = importData.rowsByTable.posts
      .filter((row) => [16, 20].includes(Number(row.id)))
      .map((row) => ({ id: row.id, title: row.title, status: row.status }));

    printCounts(`Source counts (${options.from})`, importData.sourceCounts);
    if (!options.includeTestPosts) {
      console.log("\nProduction transforms");
      console.log("  Posts 16 and 20 will be imported with status=0 (unpublished).");
      console.log(`  Search entries to remove: ${testData.hiddenRoutes.join(", ") || "none"}`);
      console.log(`  Test posts after transform: ${JSON.stringify(testData.unpublishedTests)}`);
      if (importData.excludedOrphans > 0) console.log(`  Orphan relationship rows excluded: ${importData.excludedOrphans}`);
    }

    if (!options.check && !options.apply) {
      console.log("\nDry run complete. Add --check to compare remote counts, or --apply to import.");
      return;
    }

    remote = await createRemoteClient();
    const schemas = await inspectSchemas(local, remote);
    const remoteCounts = await countRows(remote);
    printCounts("Current remote counts", remoteCounts);

    if (options.check) {
      console.log("\nCheck complete. No rows were changed.");
      return;
    }

    const backupPath = await writeBackup(options.backupDir, remote, schemas);
    console.log(`\nRemote backup: ${backupPath}`);

    const statements = DELETE_ORDER.map((table) => ({ sql: `DELETE FROM "${table}"` }));
    for (const table of INSERT_ORDER) {
      const columns = schemas[table];
      importData.rowsByTable[table].forEach((row) => statements.push(makeInsertStatement(table, columns, row)));
    }

    if (!options.includeTestPosts) {
      statements.push({
        sql: "DELETE FROM search_index WHERE route IN (?, ?)",
        args: ["/post/16", "/post/20"],
      });
    }

    await remote.batch(statements, "write");
    const finalCounts = await countRows(remote);
    printCounts("Imported remote counts", finalCounts);
    console.log("\nImport committed successfully.");
  } finally {
    await local.close().catch(() => {});
    remote?.close();
  }
}

main().catch((error) => {
  console.error(`[migrate] ${error.message}`);
  process.exitCode = 1;
});
