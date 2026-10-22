const { listDueAccountDeletions, anonymizeAccount } = require("../models/user");
const { closeDb } = require("../models/db");

async function main() {
  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const due = await listDueAccountDeletions(cutoff);
  for (const user of due) {
    await anonymizeAccount(Number(user.id));
    console.log(`Anonymized account ${user.id}`);
  }
  console.log(`Processed ${due.length} account deletion(s)`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => closeDb());
