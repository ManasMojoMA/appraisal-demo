import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Server component setAll ignore
            }
          },
        },
      }
    );

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
