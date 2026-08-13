import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/audit-logger";

export async function GET(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const cycleId = searchParams.get("cycleId");

    let whereClause: any = {
      finalStatus: { in: ["evaluated", "finalized"] }
    };
    
    if (cycleId) {
      whereClause.cycleId = cycleId;
    }

    const evaluations = await prisma.facultyEvaluation.findMany({
      where: whereClause,
      include: {
        faculty: {
          select: { name: true, email: true, department: true }
        },
        cycle: {
          select: { name: true, academicYear: true }
        },
      },
      orderBy: { updatedAt: "desc" }
    });

    return NextResponse.json({ evaluations });
  } catch (error) {
    console.error("Error fetching evaluations for moderation:", error);
    return NextResponse.json({ error: "Failed to fetch evaluations" }, { status: 500 });
  }
}
