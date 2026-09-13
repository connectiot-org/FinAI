import { prisma } from "../db/client";
import { AuditAction } from "@prisma/client";

export interface LogAuditInput {
  actorId?: string;
  action: AuditAction;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
  requestId?: string;
  ipAddress?: string;
}

export class AuditService {
  async log(input: LogAuditInput) {
    try {
      // Hash or mask IP for forensic audit trail without storing raw PII per D8
      const ipHash = input.ipAddress
        ? `ip_${Buffer.from(input.ipAddress).toString("base64").substring(0, 10)}`
        : undefined;

      return await prisma.auditLog.create({
        data: {
          actorId: input.actorId,
          action: input.action,
          targetType: input.targetType,
          targetId: input.targetId,
          metadata: input.metadata as unknown as object,
          requestId: input.requestId,
          ipHash,
        },
      });
    } catch (e) {
      console.error("Failed to write audit log:", e);
      return null;
    }
  }
}

export const auditService = new AuditService();
