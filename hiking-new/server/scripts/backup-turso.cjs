const fs = require("fs");
const path = require("path");
const { createClient } = require("@libsql/client");

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
  "auth_tokens",
  "reports",
  "moderation_actions",
  "audit_logs",
  "feature_flags",
  "notifications",
];

function timestamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

async function main() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  if (!url || !authToken) {
    throw new Error("TURSO_DATABASE_URL and TURSO_AUTH_TOKEN are required");
  }

  const db = createClient({ url, authToken });
  const output = {};
  for (const table of TABLES) {
    try {
      const result = await db.execute(`SELECT * FROM ${table}`);
      output[table] = result.rows;
    } catch (error) {
      output[table] = { error: error.message };
    }
  }
  await db.close();

  const backupDir = path.resolve(process.env.BACKUP_DIR || path.join(__dirname, "../backups"));
  fs.mkdirSync(backupDir, { recursive: true });
  const target = path.join(backupDir, `turso-backup-${timestamp()}.json`);
  fs.writeFileSync(target, JSON.stringify({ created_at: new Date().toISOString(), tables: output }, null, 2), "utf8");
  console.log(`Backup written to ${target}`);

  if (process.env.BACKUP_ENCRYPTION_RECIPIENT) {
    const { spawnSync } = require("child_process");
    const encrypted = `${target}.age`;
    const result = spawnSync("age", ["-r", process.env.BACKUP_ENCRYPTION_RECIPIENT, "-o", encrypted, target], {
      stdio: "inherit",
    });
    if (result.status !== 0) {
      throw new Error("age encryption failed; plaintext backup was retained for inspection");
    }
    console.log(`Encrypted backup written to ${encrypted}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
