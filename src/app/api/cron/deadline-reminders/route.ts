import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendEmail, getLastDayReminderEmailHtml } from "@/lib/email";

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const today = new Date();
    // Normalize to start of day for comparison
    const startOfToday = new Date(today);
    startOfToday.setHours(0, 0, 0, 0);
    
    const endOfToday = new Date(today);
    endOfToday.setHours(23, 59, 59, 999);

    // Find cycles where the deadline is specifically TODAY
    const deadlineCycles = await prisma.appraisalCycle.findMany({
      where: {
        status: "open",
        submissionDeadlineAt: {
          gte: startOfToday,
          lte: endOfToday,
        },
      },
    });

    if (deadlineCycles.length === 0) {
      return NextResponse.json({ message: "No cycles with a deadline today" });
    }

    let emailsSent = 0;
    const loginUrl = `${process.env.APP_URL || "https://facultyappraisalportal-eight.vercel.app"}/login`;

    for (const cycle of deadlineCycles) {
      const deadlineTime = cycle.submissionDeadlineAt 
        ? new Date(cycle.submissionDeadlineAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        : "11:59 PM";

      // Find faculty who have NOT submitted
      const pendingSubmissions = await prisma.facultySubmission.findMany({
        where: {
          cycleId: cycle.id,
          status: "draft",
        },
        include: {
          faculty: true,
        },
      });

      for (const sub of pendingSubmissions) {
        if (sub.faculty.email) {
          const html = getLastDayReminderEmailHtml(sub.faculty.name || "Faculty", cycle.name, deadlineTime, loginUrl);
          await sendEmail({
            to: sub.faculty.email,
            subject: `URGENT: Today is the Deadline for ${cycle.name}`,
            html,
          });
          emailsSent++;
        }
      }
    }

    return NextResponse.json({ success: true, emailsSent });
  } catch (error: any) {
    console.error("Deadline reminders cron error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
