import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendEmail, getAssignmentEmailHtml } from "@/lib/email";
import { prisma } from "@/lib/db";
import { writeAuditLog } from "@/lib/audit-logger";

export async function POST(request: NextRequest) {
  try {
    // 1. Verify admin role
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const dbAdmin = await prisma.user.findFirst({ where: { email: user.email } });
    if (!dbAdmin || (dbAdmin.role !== "admin" && dbAdmin.role !== "super_admin")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { cycleId, facultyIds } = body;

    if (!cycleId || !facultyIds || !Array.isArray(facultyIds) || facultyIds.length === 0) {
      return NextResponse.json({ error: "Cycle ID and Faculty IDs are required" }, { status: 400 });
    }

    // Find cycle and associated template
    const cycle = await prisma.appraisalCycle.findUnique({
      where: { id: cycleId },
      include: {
        formTemplates: {
          orderBy: { version: "desc" },
        },
      },
    });

    if (!cycle) {
      return NextResponse.json({ error: "Appraisal cycle not found" }, { status: 404 });
    }

    // Find template to map
    const template = cycle.formTemplates.find((t) => t.isActive) || cycle.formTemplates[0];

    if (!template) {
      return NextResponse.json({ 
        error: "This cycle does not have a Form Template mapped to it. Please link a template to the cycle first." 
      }, { status: 400 });
    }

    let assignedCount = 0;
    let skippedCount = 0;

    for (const facultyId of facultyIds) {
      // Check if already assigned
      const existing = await prisma.facultySubmission.findUnique({
        where: {
          cycleId_facultyId: {
            cycleId,
            facultyId,
          },
        },
      });

      if (existing) {
        skippedCount++;
        continue;
      }

      await prisma.facultySubmission.create({
        data: {
          cycleId,
          facultyId,
          formTemplateId: template.id,
          status: "draft",
        },
      });
      assignedCount++;

      // Send Assignment Email asynchronously
      prisma.user.findUnique({ where: { id: facultyId } }).then((faculty) => {
        if (faculty && faculty.email) {
          const loginUrl = `${process.env.APP_URL || "https://facultyappraisalportal-eight.vercel.app"}/login`;
          const deadline = cycle.submissionDeadlineAt 
            ? new Date(cycle.submissionDeadlineAt).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' })
            : "the specified deadline";
            
          const html = getAssignmentEmailHtml(faculty.name || "Faculty", cycle.name, deadline, loginUrl);
          sendEmail({ to: faculty.email, subject: `Action Required: Apprasial Cycle Assignment - ${cycle.name}`, html }).catch(console.error);
        }
      });
    }

    // Log the assignment action
    await writeAuditLog({
      actorUserId: dbAdmin.id,
      actionType: "FACULTY_ASSIGNED_TO_CYCLE",
      entityType: "AppraisalCycle",
      entityId: cycleId,
      newValueJson: { assignedCount, skippedCount, facultyIds },
    });

    return NextResponse.json({ 
      success: true, 
      assignedCount, 
      skippedCount,
      message: `Successfully assigned ${assignedCount} faculty. Skipped ${skippedCount} already assigned.`
    });
  } catch (error: any) {
    console.error("Error assigning faculty:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
