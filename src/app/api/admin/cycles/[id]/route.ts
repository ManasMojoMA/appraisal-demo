import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser, writeAuditLog } from "@/lib/audit-logger";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cycle = await prisma.appraisalCycle.findUnique({
      where: { id },
      include: { formTemplates: true },
    });
    
    if (!cycle) {
      return NextResponse.json({ error: "Cycle not found" }, { status: 404 });
    }

    return NextResponse.json({ cycle });
  } catch (error) {
    console.error("Error fetching cycle:", error);
    return NextResponse.json({ error: "Failed to fetch cycle" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const currentCycle = await prisma.appraisalCycle.findUnique({
      where: { id },
    });
    if (currentCycle?.status === "closed") {
      return NextResponse.json({ error: "Completed cycles are read-only and cannot be modified." }, { status: 400 });
    }

    const body = await request.json();
    const { name, academicYear, startDate, endDate, submissionOpenAt, submissionDeadlineAt, templateId } = body;

    const dataToUpdate: any = {};
    if (name) dataToUpdate.name = name;
    if (academicYear) dataToUpdate.academicYear = academicYear;
    if (startDate) dataToUpdate.startDate = new Date(startDate);
    if (endDate) dataToUpdate.endDate = new Date(endDate);
    if (submissionOpenAt) dataToUpdate.submissionOpenAt = new Date(submissionOpenAt);
    if (submissionDeadlineAt) dataToUpdate.submissionDeadlineAt = new Date(submissionDeadlineAt);

    const user = await getSessionUser();

    const updatedCycle = await prisma.appraisalCycle.update({
      where: { id },
      data: dataToUpdate,
    });

    if (templateId) {
      // Unlink all templates currently associated with this cycle
      await prisma.formTemplate.updateMany({
        where: { cycleId: id },
        data: { cycleId: "base-cycle" },
      });

      // Link the new template to this cycle
      await prisma.formTemplate.update({
        where: { id: templateId },
        data: { cycleId: id, isActive: true },
      });
    }

    if (user) {
      await writeAuditLog({
        actorUserId: user.id,
        actionType: "CYCLE_UPDATED",
        entityType: "AppraisalCycle",
        entityId: id,
        newValueJson: { name: updatedCycle.name, status: updatedCycle.status },
      });
    }

    return NextResponse.json({ cycle: updatedCycle });
  } catch (error) {
    console.error("Error updating cycle:", error);
    return NextResponse.json({ error: "Failed to update cycle" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (id === "base-cycle") {
      return NextResponse.json({ error: "The System Base Cycle cannot be deleted." }, { status: 400 });
    }

    const user = await getSessionUser();

    // Fetch cycle info before deleting so we can record its name in the audit log
    const cycleToDelete = await prisma.appraisalCycle.findUnique({
      where: { id },
    });

    // Completed cycles can now be deleted by master admin.
    // The UI handles confirming this destructive action.

    // Delete all dependent records in a transaction to satisfy foreign key constraints
    await prisma.$transaction([
      prisma.studentFeedbackRecord.deleteMany({ where: { cycleId: id } }),
      prisma.studentFeedbackImportBatch.deleteMany({ where: { cycleId: id } }),
      prisma.facultyEvaluation.deleteMany({ where: { cycleId: id } }),
      prisma.deadlineOverride.deleteMany({ where: { cycleId: id } }),
      prisma.facultySubmission.deleteMany({ where: { cycleId: id } }),
      prisma.rubricVersion.deleteMany({ where: { cycleId: id } }),
      prisma.formTemplate.deleteMany({ where: { cycleId: id } }),
      prisma.appraisalCycle.delete({ where: { id } }),
    ]);

    if (user && cycleToDelete) {
      await writeAuditLog({
        actorUserId: user.id,
        actionType: "CYCLE_DELETED",
        entityType: "AppraisalCycle",
        entityId: id,
        newValueJson: { name: cycleToDelete.name },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting cycle:", error);
    return NextResponse.json({ error: "Failed to delete cycle" }, { status: 500 });
  }
}
