import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { writeAuditLog } from "@/lib/audit-logger";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    // 1. Verify current user is super_admin
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

    // 4. Delete from Supabase Auth if supabaseId exists
    if (targetUser.supabaseId) {
      const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(
        targetUser.supabaseId
      );
      if (authError) {
        console.error("Supabase Auth delete error:", authError);
        // Continue with Prisma deletion even if Supabase fails
      }
    }

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
