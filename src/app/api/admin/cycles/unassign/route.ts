import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser, writeAuditLog } from "@/lib/audit-logger";

export async function POST(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser || (sessionUser.role !== "admin" && sessionUser.role !== "super_admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { cycleId, facultyIds } = body;

    if (!cycleId || !facultyIds || !Array.isArray(facultyIds) || facultyIds.length === 0) {
      return NextResponse.json({ error: "Missing cycleId or facultyIds" }, { status: 400 });
    }

    const cycle = await prisma.appraisalCycle.findUnique({ where: { id: cycleId } });
    if (!cycle) {
      return NextResponse.json({ error: "Cycle not found" }, { status: 404 });
    }

    // Role-based restriction: Only super_admin can unassign from a completed cycle
    if ((cycle.status === "closed" || cycle.status === "finalized" || cycle.status === "archived") && sessionUser.role !== "super_admin") {
      return NextResponse.json({ error: "Only a Master Admin can unassign faculties from a completed cycle." }, { status: 403 });
    }

    await prisma.$transaction(async (tx) => {
      // Find the submissions to delete
      const submissions = await tx.facultySubmission.findMany({
        where: {
          cycleId: cycleId,
          facultyId: { in: facultyIds },
        },
        select: { id: true },
      });

      const submissionIds = submissions.map(s => s.id);

      if (submissionIds.length > 0) {
        // Delete evaluations first
        await tx.facultyEvaluation.deleteMany({
          where: { submissionId: { in: submissionIds } },
        });

        // Delete entries
        await tx.submissionEntry.deleteMany({
          where: { submissionId: { in: submissionIds } },
        });

        // Delete submissions
        await tx.facultySubmission.deleteMany({
          where: { id: { in: submissionIds } },
        });
      }

      await writeAuditLog({
        actorUserId: sessionUser.id,
        actionType: "CYCLE_UNASSIGNED",
        entityType: "AppraisalCycle",
        entityId: cycleId,
        newValueJson: { count: facultyIds.length, facultyIds },
        reason: `Unassigned ${facultyIds.length} faculty from cycle`,
      });
    });

    return NextResponse.json({ success: true, message: `Successfully unassigned ${facultyIds.length} faculty members.` });
  } catch (error: any) {
    console.error("Unassign Cycle Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
