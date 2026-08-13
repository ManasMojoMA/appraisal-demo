import { prisma } from "./db";

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

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function getSessionUser() {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {}
          },
        },
      }
    );

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
