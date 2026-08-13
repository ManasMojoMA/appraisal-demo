import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser, writeAuditLog } from "@/lib/audit-logger";

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    if (id === "system-default-rubric") {
      return NextResponse.json({ error: "Cannot delete the system default rubric" }, { status: 403 });
    }

    const rubric = await prisma.rubricVersion.findUnique({
      where: { id },
      include: {
        cycle: true,
      },
    });

    if (!rubric) {
      return NextResponse.json({ error: "Rubric not found" }, { status: 404 });
    }

    // Check if it's currently linked to an active/evaluation cycle
    if (rubric.isActive && rubric.cycle && rubric.cycle.id !== "base-cycle") {
      return NextResponse.json({ 
        error: `Cannot delete this rubric as it is actively in use by cycle: ${rubric.cycle.name}` 
      }, { status: 400 });
    }

    // Delete
    await prisma.rubricVersion.delete({
      where: { id },
    });

    const user = await getSessionUser();
    if (user) {
      await writeAuditLog({
        actorUserId: user.id,
        actionType: "RUBRIC_DELETED",
        entityType: "RubricVersion",
        entityId: id,
        oldValueJson: { name: rubric.name, version: rubric.version },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting rubric:", error);
    return NextResponse.json({ error: "Failed to delete rubric" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const { name, configJson } = body;

    const existing = await prisma.rubricVersion.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (existing.isFrozen) {
       return NextResponse.json({ error: "Cannot modify a frozen rubric" }, { status: 403 });
    }

    const updated = await prisma.rubricVersion.update({
      where: { id },
      data: { name, configJson },
    });

    const user = await getSessionUser();
    if (user) {
      await writeAuditLog({
        actorUserId: user.id,
        actionType: "RUBRIC_UPDATED",
        entityType: "RubricVersion",
        entityId: id,
        newValueJson: { name },
      });
    }

    return NextResponse.json({ rubric: updated }, { status: 200 });
  } catch (error) {
    console.error("Error updating rubric:", error);
    return NextResponse.json({ error: "Failed to update rubric" }, { status: 500 });
  }
}
