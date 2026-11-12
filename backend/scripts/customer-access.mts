// Trusted database operator only. No public API can change a customer's paid access.
import { z } from "zod";
import { Database } from "../dist/src/database.js";
import { updateCustomerAccess } from "../dist/src/customer-access.js";
const db = new Database();
try {
  const args = process.argv.slice(2);
  const apply = args.includes("--apply");
  const values = args.filter((value) => !value.startsWith("--"));
  if (
    args.some((value) => value.startsWith("--") && value !== "--apply") ||
    values.length !== 3
  )
    throw new Error(
      "Usage: customer-access.mts <organisation UUID> <existing admin account> <paid-until ISO timestamp|revoke> [--apply]",
    );
  const [organisationId, account, until] = values;
  z.uuid().parse(organisationId);
  const date =
    until === "revoke"
      ? null
      : new Date(z.iso.datetime({ offset: true }).parse(until));
  const result = await updateCustomerAccess(
    db,
    organisationId,
    account,
    date,
    apply,
  );
  console.log(JSON.stringify(result));
  if (!apply)
    console.log(
      "Dry run only. Verify payment and the target organisation, then repeat with --apply. All organisation sessions are revoked when applied.",
    );
} catch (error) {
  console.error(
    error instanceof Error ? error.message : "Customer access update failed.",
  );
  process.exitCode = 1;
} finally {
  await db.$disconnect();
}
