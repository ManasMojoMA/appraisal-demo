import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser, writeAuditLog } from "@/lib/audit-logger";

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user || user.role === "faculty") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const { submissionId, rubricVersionId, scores, evaluatorNotes, status } = body;
    // scores = { categoryKey: number, ... }
    // status = "draft" | "evaluated"

    if (!submissionId || !rubricVersionId || !scores) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const submission = await prisma.facultySubmission.findUnique({
      where: { id: submissionId },
      include: { faculty: true }
    });

    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    // Calculate total score
    const finalScore = Object.values(scores).reduce((sum: number, val: any) => sum + (Number(val) || 0), 0);

    // Upsert the evaluation
    const evaluation = await prisma.facultyEvaluation.upsert({
      where: { submissionId },
      update: {
        rubricVersion: { connect: { id: rubricVersionId } },
        teachingStudentFeedbackMarks: Number(scores.teaching) || 0,
        academicDeliveryMarks: Number(scores.academic_delivery) || 0,
        innovationMarks: Number(scores.innovation) || 0,
        researchMarks: Number(scores.research_publications) || 0,
        serviceMarks: Number(scores.service_contribution) || 0,
        penaltyMarks: Number(scores.penalty) || 0,
        finalScore,
        evaluatorNotes: evaluatorNotes || "",
        finalStatus: status === "evaluated" ? "evaluated" : "draft",
        updatedAt: new Date(),
      },
      create: {
        submission: { connect: { id: submissionId } },
        rubricVersion: { connect: { id: rubricVersionId } },
        cycle: { connect: { id: submission.cycleId } },
        faculty: { connect: { id: submission.facultyId } },
        teachingStudentFeedbackMarks: Number(scores.teaching) || 0,
        academicDeliveryMarks: Number(scores.academic_delivery) || 0,
        innovationMarks: Number(scores.innovation) || 0,
        researchMarks: Number(scores.research_publications) || 0,
        serviceMarks: Number(scores.service_contribution) || 0,
        penaltyMarks: Number(scores.penalty) || 0,
        finalScore,
        evaluatorNotes: evaluatorNotes || "",
        finalStatus: status === "evaluated" ? "evaluated" : "draft",
      }
    });

    if (user) {
      await writeAuditLog({
        actorUserId: user.id,
        actionType: status === "evaluated" ? "EVALUATION_FINALIZED" : "EVALUATION_DRAFT_SAVED",
        entityType: "FacultyEvaluation",
        entityId: evaluation.id,
        newValueJson: { finalScore, status },
      });
    }

    return NextResponse.json({ success: true, evaluation });
  } catch (error) {
    console.error("Error saving evaluation:", error);
    return NextResponse.json({ error: "Failed to save evaluation" }, { status: 500 });
  }
}
