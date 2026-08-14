import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendEmail, getAcknowledgementEmailHtml } from "@/lib/email";
import { prisma } from "@/lib/db";
import { writeAuditLog } from "@/lib/audit-logger";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { cycleId, formTemplateId, isFinalSubmit, submissionState } = body;

    const dbUser = await prisma.user.findFirst({
      where: { email: user.email },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const cycle = await prisma.appraisalCycle.findUnique({ where: { id: cycleId } });
    if (!cycle) {
      return NextResponse.json({ error: "Cycle not found" }, { status: 404 });
    }

    const existingSubmission = await prisma.facultySubmission.findUnique({
      where: {
        cycleId_facultyId: {
          cycleId,
          facultyId: dbUser.id,
        },
      },
    });

    if (new Date() > new Date(cycle.submissionDeadlineAt) && existingSubmission?.status !== "reopened") {
      return NextResponse.json({ error: "The deadline for this appraisal cycle has passed." }, { status: 403 });
    }

    // Map UI state to DB submission format
    const categoryProgressJson = submissionState.enabledCategories.reduce((acc: any, catKey: string) => {
      acc[catKey] = { enabled: true, complete: isFinalSubmit };
      return acc;
    }, {});

    // Create or Update Submission and Entries in a single transaction to prevent race conditions
    const submission = await prisma.$transaction(async (tx) => {
      const sub = await tx.facultySubmission.upsert({
        where: {
          cycleId_facultyId: {
            cycleId,
            facultyId: dbUser.id,
          },
        },
        update: {
          status: isFinalSubmit ? "submitted" : (existingSubmission?.status === "reopened" ? "reopened" : "draft"),
          submittedAt: isFinalSubmit ? new Date() : null,
        },
        create: {
          cycleId,
          facultyId: dbUser.id,
          formTemplateId,
          status: isFinalSubmit ? "submitted" : "draft",
          submittedAt: isFinalSubmit ? new Date() : null,
        },
      });

      // For simplicity, we delete existing entries and recreate them on each save.
      await tx.submissionEntry.deleteMany({
        where: { submissionId: sub.id },
      });

      const newEntries: any[] = [];
      for (const categoryKey of submissionState.enabledCategories) {
        const catEntries = submissionState.entriesByCategory[categoryKey] || [];
        catEntries.forEach((entry: any, index: number) => {
          newEntries.push({
            submissionId: sub.id,
            categoryKey: categoryKey,
            entryIndex: index,
            dataJson: entry.values,
          });
        });
      }

      if (newEntries.length > 0) {
        await tx.submissionEntry.createMany({
          data: newEntries,
        });
      }

      return sub;
    });

    // Audit Log and Email for final submission
    if (isFinalSubmit) {
      await writeAuditLog({
        actorUserId: dbUser.id,
        actionType: "SUBMISSION_FINALIZED",
        entityType: "Submission",
        entityId: submission.id,
        reason: "Faculty finalized self-review",
      });

      // Send Acknowledgement Email asynchronously
      const cycle = await prisma.appraisalCycle.findUnique({ where: { id: cycleId } });
      if (cycle && dbUser.email) {
        const timestamp = new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
        const html = getAcknowledgementEmailHtml(dbUser.name || "Faculty", cycle.name, timestamp);
        sendEmail({ to: dbUser.email, subject: `Submission Received: ${cycle.name}`, html }).catch(console.error);
      }
    }

    return NextResponse.json({ success: true, submissionId: submission.id });
  } catch (error) {
    console.error("Submission error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
