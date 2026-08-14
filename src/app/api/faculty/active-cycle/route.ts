import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user from our DB
    const dbUser = await prisma.user.findFirst({
      where: { email: user.email }, // Relying on email mapping
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User profile not found in database" }, { status: 404 });
    }

    // Find active assigned submission for this faculty in an open cycle
    const submission = await prisma.facultySubmission.findFirst({
      where: {
        facultyId: dbUser.id,
        cycle: {
          status: "open",
        },
      },
      include: {
        cycle: true,
        formTemplate: true,
        entries: true,
      },
    });

    if (!submission) {
      return NextResponse.json({ error: "No active assigned appraisal cycle found" }, { status: 404 });
    }

    return NextResponse.json({
      cycle: {
        id: submission.cycle.id,
        name: submission.cycle.name,
        deadline: submission.cycle.submissionDeadlineAt,
        status: submission.cycle.status,
      },
      formTemplate: submission.formTemplate,
      submission: {
        id: submission.id,
        cycleId: submission.cycleId,
        facultyId: submission.facultyId,
        formTemplateId: submission.formTemplateId,
        status: submission.status,
        submittedAt: submission.submittedAt,
        entries: submission.entries,
      },
    });
  } catch (error) {
    console.error("Error fetching active cycle:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
