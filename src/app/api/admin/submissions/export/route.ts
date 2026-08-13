import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/audit-logger";

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const cycleId = searchParams.get("cycleId");

    if (!cycleId) {
      return NextResponse.json({ error: "Missing cycleId parameter" }, { status: 400 });
    }

    const submissions = await prisma.facultySubmission.findMany({
      where: { cycleId },
      include: {
        faculty: true,
        entries: true,
        formTemplate: true,
      },
    });

    return NextResponse.json({ submissions });
  } catch (error: any) {
    console.error("Submissions export API error:", error);
    return NextResponse.json({ error: "Failed to fetch submissions for export" }, { status: 500 });
  }
}
