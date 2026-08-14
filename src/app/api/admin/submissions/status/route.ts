import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import { writeAuditLog } from "@/lib/audit-logger";

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sessionUser = await prisma.user.findFirst({
      where: { email: user.email },
    });

    if (!sessionUser || (sessionUser.role !== "admin" && sessionUser.role !== "super_admin")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { facultyIds, cycleId, status } = body;

    if (!facultyIds || !Array.isArray(facultyIds) || !cycleId || !status) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    if (status !== "reopened" && status !== "submitted") {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const cycle = await prisma.appraisalCycle.findUnique({
      where: { id: cycleId }
    });

    if (!cycle) {
      return NextResponse.json({ error: "Cycle not found" }, { status: 404 });
    }

    // Role-based restriction: Only super_admin can change status in a completed cycle
    if ((cycle.status === "closed" || cycle.status === "finalized" || cycle.status === "archived") && sessionUser.role !== "super_admin") {
      return NextResponse.json({ error: "Only a Master Admin can manage submissions for a completed cycle." }, { status: 403 });
    }

    const updateData: any = {
      status: status,
    };

    if (status === "reopened") {
      updateData.reopenedAt = new Date();
      updateData.reopenedBy = sessionUser.id;
    }

    // Determine target condition based on desired status change
    const targetStatusCondition: any = status === "reopened" 
      ? { in: ["submitted", "locked"] } 
      : { equals: "reopened" };

    const updateResult = await prisma.facultySubmission.updateMany({
      where: {
        cycleId: cycleId,
        facultyId: { in: facultyIds },
        status: targetStatusCondition
      },
      data: updateData
    });

    // Write audit logs
    for (const facultyId of facultyIds) {
      await writeAuditLog({
        actorUserId: sessionUser.id,
        actionType: status === "reopened" ? "SUBMISSION_REOPENED" : "SUBMISSION_FORCE_CLOSED",
        entityType: "FacultySubmission",
        entityId: facultyId,
        newValueJson: {
          cycleId,
          message: status === "reopened" ? "Admin reopened submission" : "Admin forced closed resubmission"
        }
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: `Successfully updated ${updateResult.count} submissions to ${status}.` 
    });

  } catch (error) {
    console.error("Submission status update error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
