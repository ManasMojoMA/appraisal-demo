import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { CycleStatus } from "@prisma/client";
import { getSessionUser, writeAuditLog } from "@/lib/audit-logger";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    if (!["draft", "active", "completed"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const mappedStatus = status === "active" ? CycleStatus.open : status === "completed" ? CycleStatus.closed : CycleStatus.draft;

    // Block activation if another cycle is already active (unless it has passed its deadline, in which case auto-close it)
    if (mappedStatus === CycleStatus.open) {
      const existingActiveCycles = await prisma.appraisalCycle.findMany({
        where: {
          id: { not: id },
          status: CycleStatus.open,
        },
      });

      for (const existingActiveCycle of existingActiveCycles) {
        if (new Date() > new Date(existingActiveCycle.submissionDeadlineAt || existingActiveCycle.endDate)) {
          // Auto-close past deadline cycle
          await prisma.appraisalCycle.update({
            where: { id: existingActiveCycle.id },
            data: { status: CycleStatus.closed },
          });
          await prisma.formTemplate.updateMany({
            where: { cycleId: existingActiveCycle.id },
            data: { isActive: false },
          });
        } else {
          return NextResponse.json(
            { error: `Cannot activate this cycle. Another cycle "${existingActiveCycle.name}" is currently active. Please complete or delete it first.` },
            { status: 400 }
          );
        }
      }
    }

    const updatedCycle = await prisma.appraisalCycle.update({
      where: { id },
      data: { status: mappedStatus },
      include: { formTemplates: true },
    });

    // When a cycle is activated, mark its linked templates as active
    if (mappedStatus === CycleStatus.open) {
      await prisma.formTemplate.updateMany({
        where: { cycleId: id },
        data: { isActive: true },
      });
    }

    // When a cycle is completed/closed, mark its linked templates as inactive (draft)
    if (mappedStatus === CycleStatus.closed) {
      await prisma.formTemplate.updateMany({
        where: { cycleId: id },
        data: { isActive: false },
      });
    }

    const sessionUser = await getSessionUser();
    if (sessionUser) {
      await writeAuditLog({
        actorUserId: sessionUser.id,
        actionType: "CYCLE_UPDATED",
        entityType: "AppraisalCycle",
        entityId: id,
        newValueJson: { status: mappedStatus },
      });
    }

    return NextResponse.json({ cycle: updatedCycle });
  } catch (error) {
    console.error("Error updating cycle status:", error);
    return NextResponse.json({ error: "Failed to update status" }, { status: 500 });
  }
}
