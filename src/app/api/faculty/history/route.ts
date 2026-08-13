import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/audit-logger";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "faculty") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch all submissions for the faculty where the cycle is closed
    const submissions = await prisma.facultySubmission.findMany({
      where: {
        facultyId: user.id,
        cycle: {
          status: "closed",
        },
      },
      include: {
        cycle: true,
      },
      orderBy: {
        cycle: {
          endDate: "desc",
        },
      },
    });

    return NextResponse.json({ submissions });
  } catch (error: any) {
    console.error("History API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch submission history" },
      { status: 500 }
    );
  }
}
