import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import { demoBlock } from "@/lib/demo-guard";
import { writeAuditLog } from "@/lib/audit-logger";

/**
 * Neither handler here checked who was calling.
 *
 * DELETE removed any user by id, and PUT rewrote any user's name and email —
 * both from an unauthenticated request. The audit log recorded the action only
 * when a session happened to exist, so the unauthenticated path was also the
 * untraced one. Both now require an admin session before anything is read or
 * written.
 */
async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };

  const actor = await prisma.user.findFirst({ where: { email: user.email } });
  if (!actor || (actor.role !== "admin" && actor.role !== "super_admin")) {
    return { error: NextResponse.json({ error: "Admin only" }, { status: 403 }) };
  }
  return { actor };
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;

    const { actor, error } = await requireAdmin();
    if (error) return error;

    const blocked = demoBlock("Deleting accounts");
    if (blocked) return blocked;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.id === actor!.id) {
      return NextResponse.json(
        { error: "You cannot delete your own account" },
        { status: 400 },
      );
    }

    await prisma.user.delete({ where: { id } });

    await writeAuditLog({
      actorUserId: actor!.id,
      actionType: "FACULTY_DELETED",
      entityType: "User",
      entityId: id,
      oldValueJson: { email: user.email, name: user.name },
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Delete Error:", error);
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}

/**
 * Editing a faculty record stays open in the demo. Name, department and employee
 * code are ordinary data, and being able to correct them is part of what the
 * portal does. Note the update is field-by-field on purpose — spreading the body
 * would let a caller set `role` and promote themselves.
 */
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;

    const { actor, error } = await requireAdmin();
    if (error) return error;

    const body = await request.json();
    const { name, email, department, employeeCode } = body;

    if (email) {
      const existing = await prisma.user.findFirst({
        where: { email: email.toLowerCase(), NOT: { id } },
      });
      if (existing) {
        return NextResponse.json(
          { error: "Another user with this email already exists" },
          { status: 400 },
        );
      }
    }

    if (employeeCode) {
      const existingCode = await prisma.user.findFirst({
        where: { employeeCode, NOT: { id } },
      });
      if (existingCode) {
        return NextResponse.json(
          { error: `Employee code ${employeeCode} is already assigned` },
          { status: 400 },
        );
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        name,
        email: email?.toLowerCase(),
        department,
        employeeCode,
      },
    });

    await writeAuditLog({
      actorUserId: actor!.id,
      actionType: "FACULTY_UPDATED",
      entityType: "User",
      entityId: id,
      newValueJson: { name, email, department, employeeCode },
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error: unknown) {
    console.error("Update Error:", error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}
