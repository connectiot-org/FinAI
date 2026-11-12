import { randomUUID } from "node:crypto";
import type { PrismaClient } from "@prisma/client";
import { recordAudit } from "./audit";

// Only called by the trusted operator CLI, never a customer-facing controller.
export async function updateCustomerAccess(
  db: PrismaClient,
  organisationId: string,
  operatorAccount: string,
  paidAccessUntil: Date | null,
  apply: boolean,
) {
  if (
    paidAccessUntil &&
    (!Number.isFinite(paidAccessUntil.getTime()) ||
      paidAccessUntil.getTime() <= Date.now())
  )
    throw new Error("Paid access must end at a valid future date.");
  return db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "Organisation" WHERE id=${organisationId}::uuid FOR UPDATE`;
    const organisation = await tx.organisation.findUniqueOrThrow({
      where: { id: organisationId },
    });
    const account = await tx.account.findUniqueOrThrow({
      where: { username: operatorAccount },
    });
    const member = await tx.membership.findUnique({
      where: {
        organisationId_userId: { organisationId, userId: account.userId },
      },
    });
    if (account.disabled || !member?.active || !member.isAdministrator)
      throw new Error(
        "An enabled organisation administrator must be identified for the operator audit.",
      );
    const before = organisation.paidAccessUntil;
    if (apply) {
      await tx.organisation.update({
        where: { id: organisationId },
        data: { paidAccessUntil },
      });
      await tx.session.deleteMany({ where: { organisationId } });
      await recordAudit(
        tx,
        { organisationId, userId: account.userId },
        "billing.paid_access_updated",
        randomUUID(),
        undefined,
        {
          reasonCode: paidAccessUntil
            ? "payment_confirmed"
            : "paid_access_revoked",
          previousPaidAccessUntil: before?.toISOString() || "none",
          paidAccessUntil: paidAccessUntil?.toISOString() || "none",
        },
      );
    }
    return {
      organisationId,
      previousPaidAccessUntil: before,
      paidAccessUntil,
      applied: apply,
    };
  });
}
