import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import { writeAuditLog } from "@/lib/audit-logger";
import { demoBlock } from "@/lib/demo-guard";

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    // 1. Verify current user is super_admin
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentAdmin = await prisma.user.findFirst({
      where: { email: user.email },
    });
    if (!currentAdmin || currentAdmin.role !== "super_admin") {
      return NextResponse.json(
        { error: "Only super admins can delete admin accounts" },
        { status: 403 }
      );
    }

    const blocked = demoBlock("Deleting accounts");
    if (blocked) return blocked;

    // 2. Prevent deleting yourself
    if (currentAdmin.id === id) {
      return NextResponse.json(
        { error: "You cannot delete your own account" },
        { status: 400 }
      );
    }

    // 3. Look up the target user in Prisma
    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 4. The Firebase auth account is deliberately left in place.
    //
    // Removing another user's Firebase account needs a service account, which
    // this deployment intentionally does not carry — see src/lib/firebase-auth.ts.
    // The Prisma row is the authorisation record, so deleting it removes all
    // access; the orphaned auth account can sign in but resolves to no user and
    // is rejected by every route. An operator running this for real should
    // remove it in the Firebase console, or wire up the Admin SDK.

    // 5. Delete from Prisma (clean up relations first to prevent foreign key errors)
    await prisma.$transaction([
      prisma.auditLog.deleteMany({ where: { actorUserId: id } }),
      prisma.user.delete({ where: { id } }),
    ]);

    // Log the action
    await writeAuditLog({
      actorUserId: currentAdmin.id,
      actionType: "ADMIN_DELETED",
      entityType: "User",
      entityId: id,
      oldValueJson: { email: targetUser.email, role: targetUser.role },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Delete admin error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete admin" },
      { status: 500 }
    );
  }
}
