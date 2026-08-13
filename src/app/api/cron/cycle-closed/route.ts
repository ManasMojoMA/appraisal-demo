import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendEmail, getCycleClosedEmailHtml } from "@/lib/email";

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const today = new Date();
    // Start of today
    const startOfToday = new Date(today);
    startOfToday.setHours(0, 0, 0, 0);

    // Find cycles that are STILL OPEN but the deadline was BEFORE today
    const expiredCycles = await prisma.appraisalCycle.findMany({
      where: {
        status: "open",
        submissionDeadlineAt: {
          lt: startOfToday, // Deadline has passed
        },
      },
    });

    if (expiredCycles.length === 0) {
      return NextResponse.json({ message: "No expired cycles to close today" });
    }

    let emailsSent = 0;

    for (const cycle of expiredCycles) {
      // 1. Mark cycle as closed
      await prisma.appraisalCycle.update({
        where: { id: cycle.id },
        data: { status: "closed" },
      });

      // 2. Mark its template as inactive
      await prisma.formTemplate.updateMany({
        where: { cycleId: cycle.id },
        data: { isActive: false },
      });

      // 3. Find ALL faculty assigned to this cycle (regardless of submission status)
      const allSubmissions = await prisma.facultySubmission.findMany({
        where: { cycleId: cycle.id },
        include: { faculty: true },
      });

      for (const sub of allSubmissions) {
        if (sub.faculty.email) {
          const html = getCycleClosedEmailHtml(sub.faculty.name || "Faculty", cycle.name);
          await sendEmail({
            to: sub.faculty.email,
            subject: `Appraisal Cycle Closed: ${cycle.name}`,
            html,
          });
          emailsSent++;
        }
      }
    }

    return NextResponse.json({ success: true, cyclesClosed: expiredCycles.length, emailsSent });
  } catch (error: any) {
    console.error("Cycle closed cron error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
