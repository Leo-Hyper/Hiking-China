const { run, closeDb } = require("../models/db");

async function main() {
  const email = String(process.argv[2] || "").trim().toLowerCase();
  if (!email) {
    console.error("Usage: node scripts/set-admin.cjs <email>");
    process.exitCode = 1;
    return;
  }

  const result = await run(
    "UPDATE users SET role = 'admin', account_status = 'active', updated_at = CURRENT_TIMESTAMP WHERE email = ?",
    [email]
  );
  if (Number(result.changes) !== 1) {
    console.error(`No user found for ${email}`);
    process.exitCode = 1;
    return;
  }
  console.log(`Granted admin role to ${email}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => closeDb());
