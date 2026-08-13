import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendEmail, getDailyReminderEmailHtml } from "@/lib/email";

export async function GET(request: Request) {
  try {
    // Basic security check for external cron services
    const authHeader = request.headers.get("authorization");
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find all active cycles where the deadline has NOT passed yet
    const activeCycles = await prisma.appraisalCycle.findMany({
      where: {
        status: "open",
        submissionDeadlineAt: {
          gte: today, // Deadline is today or in the future
        },
      },
    });

    if (activeCycles.length === 0) {
      return NextResponse.json({ message: "No active cycles found for daily reminders" });
    }

    let emailsSent = 0;
    const loginUrl = `${process.env.APP_URL || "https://facultyappraisalportal-eight.vercel.app"}/login`;

    for (const cycle of activeCycles) {
      const deadline = cycle.submissionDeadlineAt 
        ? new Date(cycle.submissionDeadlineAt).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' })
        : "the specified deadline";

      // Find faculty who have NOT submitted (status is draft)
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
          const html = getDailyReminderEmailHtml(sub.faculty.name || "Faculty", cycle.name, deadline, loginUrl);
          await sendEmail({
            to: sub.faculty.email,
            subject: `Reminder: Complete your Self-Assessment for ${cycle.name}`,
            html,
          });
          emailsSent++;
        }
      }
    }

    return NextResponse.json({ success: true, emailsSent });
  } catch (error: any) {
    console.error("Daily reminders cron error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
