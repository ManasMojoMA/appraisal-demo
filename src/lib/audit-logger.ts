import { prisma } from "./db";
import { createClient } from "@/lib/supabase/server";

interface AuditLogInput {
  actorUserId: string;
  actionType: string;
  entityType: string;
  entityId?: string;
  oldValueJson?: unknown;
  newValueJson?: unknown;
  reason?: string;
  ipAddress?: string;
  userAgent?: string;
}

export async function writeAuditLog(input: AuditLogInput) {
  return prisma.auditLog.create({
    data: {
      actorUserId: input.actorUserId,
      actionType: input.actionType,
      entityType: input.entityType,
      entityId: input.entityId ?? null,
      oldValueJson: input.oldValueJson
        ? JSON.parse(JSON.stringify(input.oldValueJson))
        : null,
      newValueJson: input.newValueJson
        ? JSON.parse(JSON.stringify(input.newValueJson))
        : null,
      reason: input.reason ?? null,
      ipAddress: input.ipAddress ?? null,
      userAgent: input.userAgent ?? null,
    },
  });
}


export async function getSessionUser() {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const dbUser = await prisma.user.findFirst({
      where: { email: user.email },
    });
    return dbUser;
  } catch (error) {
    console.error("Error getting session user for audit logging:", error);
    return null;
  }
}
