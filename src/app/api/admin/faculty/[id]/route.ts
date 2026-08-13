import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser, writeAuditLog } from "@/lib/audit-logger";

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    await prisma.user.delete({ where: { id } });

    const sessionUser = await getSessionUser();
    if (sessionUser) {
      await writeAuditLog({
        actorUserId: sessionUser.id,
        actionType: "FACULTY_DELETED",
        entityType: "User",
        entityId: id,
        oldValueJson: { email: user.email, name: user.name },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Delete Error:", error);
    return NextResponse.json({ error: error.message || "Failed to delete user" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const { name, email, department, employeeCode } = body;

    // Check for email conflicts
    if (email) {
      const existing = await prisma.user.findFirst({
        where: { email: email.toLowerCase(), NOT: { id } },
      });
      if (existing) {
        return NextResponse.json({ error: "Another user with this email already exists" }, { status: 400 });
      }
    }

    if (employeeCode) {
      const existingCode = await prisma.user.findFirst({
        where: { employeeCode, NOT: { id } },
      });
      if (existingCode) {
        return NextResponse.json({ error: `Employee code ${employeeCode} is already assigned to ${existingCode.email}` }, { status: 400 });
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

    const sessionUser = await getSessionUser();
    if (sessionUser) {
      await writeAuditLog({
        actorUserId: sessionUser.id,
        actionType: "FACULTY_UPDATED",
        entityType: "User",
        entityId: id,
        newValueJson: { name, email, department, employeeCode },
      });
    }

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error: any) {
    console.error("Update Error:", error);
    return NextResponse.json({ error: error.message || "Failed to update user" }, { status: 500 });
  }
}
