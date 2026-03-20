import { backfillMissingParticipantNames } from "../lib/calls";

async function main() {
  const r = await backfillMissingParticipantNames();
  console.log(
    `Examined ${r.examined} call(s). Updated ${r.updated} with participant names.`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
