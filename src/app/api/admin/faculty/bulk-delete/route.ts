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
    const { ids } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "No faculty IDs provided" }, { status: 400 });
    }

    // Wrap in a transaction to safely delete related records
    await prisma.$transaction(async (tx) => {
      // Find the submissions for these faculties
      const submissions = await tx.facultySubmission.findMany({
        where: { facultyId: { in: ids } },
        select: { id: true },
      });
      const submissionIds = submissions.map((s) => s.id);

      // Delete FacultyEvaluations
      if (submissionIds.length > 0) {
        await tx.facultyEvaluation.deleteMany({
          where: { submissionId: { in: submissionIds } },
        });

        // Delete SubmissionEntries
        await tx.submissionEntry.deleteMany({
          where: { submissionId: { in: submissionIds } },
        });

        // Delete FacultySubmissions
        await tx.facultySubmission.deleteMany({
          where: { id: { in: submissionIds } },
        });
      }

      // Finally, delete the users
      await tx.user.deleteMany({
        where: { id: { in: ids }, role: "faculty" }, // Ensure only faculties are deleted
      });

      // Log the bulk action
      await writeAuditLog({
        actorUserId: sessionUser.id,
        actionType: "FACULTY_BULK_DELETED",
        entityType: "User",
        newValueJson: { count: ids.length, ids },
      });
    });

    return NextResponse.json({ success: true, count: ids.length });
  } catch (error: any) {
    console.error("Bulk Delete Error:", error);
    return NextResponse.json({ error: "Failed to delete one or more faculty members. They might have existing activity logs." }, { status: 500 });
  }
}
