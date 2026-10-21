#!/usr/bin/env node

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
];

async function scalar(client, sql, args = []) {
  const result = await client.execute({ sql, args });
  return result.rows[0]?.value ?? Object.values(result.rows[0] || {})[0] ?? 0;
}

async function main() {
  const url = process.env.TARGET_TURSO_URL;
  const authToken = process.env.TARGET_TURSO_TOKEN;
  if (!url || !authToken) {
    throw new Error("Set TARGET_TURSO_URL and TARGET_TURSO_TOKEN.");
  }

  const client = createClient({ url, authToken });
  try {
    const counts = {};
    for (const table of TABLES) {
      counts[table] = Number(await scalar(client, `SELECT COUNT(*) AS value FROM "${table}"`));
    }

    const integrity = await client.execute("PRAGMA integrity_check");
    const integrityValue = integrity.rows[0]?.integrity_check
      || Object.values(integrity.rows[0] || {})[0]
      || "unknown";
    const publishedPosts = Number(
      await scalar(client, "SELECT COUNT(*) AS value FROM posts WHERE status = 1"),
    );
    const draftPosts = Number(
      await scalar(client, "SELECT COUNT(*) AS value FROM posts WHERE status = 0"),
    );
    const distinctUsers = Number(
      await scalar(client, "SELECT COUNT(DISTINCT username) AS value FROM users"),
    );

    console.log("Turso target verification");
    for (const [table, count] of Object.entries(counts)) {
      console.log(`  ${table.padEnd(24)} ${count}`);
    }
    console.log(`  published_posts          ${publishedPosts}`);
    console.log(`  draft_posts              ${draftPosts}`);
    console.log(`  distinct_users           ${distinctUsers}`);
    console.log(`  integrity_check          ${integrityValue}`);

    const expected = {
      users: 12,
      posts: 17,
      comments: 11,
      comment_likes: 1,
      post_likes: 0,
      followers: 0,
      bookmarks: 2,
      search_index: 16,
      events: 4,
      event_registrations: 0,
    };

    for (const [table, count] of Object.entries(expected)) {
      if (counts[table] !== count) {
        throw new Error(`Unexpected ${table} count: expected ${count}, received ${counts[table]}`);
      }
    }
    if (publishedPosts !== 15 || draftPosts !== 2 || distinctUsers !== 12) {
      throw new Error("Business-data verification failed.");
    }
    if (String(integrityValue).toLowerCase() !== "ok") {
      throw new Error(`SQLite integrity check failed: ${integrityValue}`);
    }
  } finally {
    client.close();
  }
}

main().catch((error) => {
  console.error(`[verify-turso] ${error.stack || error.message}`);
  process.exitCode = 1;
});
