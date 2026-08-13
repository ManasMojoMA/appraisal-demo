import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser, writeAuditLog } from "@/lib/audit-logger";

const defaultRubricConfig = {
  maxTotalMarks: 100,
  passingMarks: 50,
  categories: [
    {
      key: "academic_delivery",
      label: "Academic Delivery",
      maxMarks: 40,
      description: "Evaluation based on course delivery, student feedback, and pedagogy.",
    },
    {
      key: "research_publications",
      label: "Research & Publications",
      maxMarks: 30,
      description: "Evaluation of journal papers, patents, and funded projects.",
    },
    {
      key: "service_contribution",
      label: "Service Contribution",
      maxMarks: 15,
      description: "Institutional roles and committee memberships.",
    },
    {
      key: "innovation",
      label: "Innovation",
      maxMarks: 15,
      description: "Innovations in teaching, setups, or systems.",
    }
  ]
};

async function ensureSystemDefaults() {
  try {
    // 1. Ensure system base cycle exists
    let baseCycle = await prisma.appraisalCycle.findUnique({
      where: { id: "base-cycle" },
    });

    if (!baseCycle) {
      await prisma.appraisalCycle.create({
        data: {
          id: "base-cycle",
          name: "Institute Base Cycle",
          academicYear: "2025-26",
          startDate: new Date("2025-07-01"),
          endDate: new Date("2026-06-30"),
          submissionOpenAt: new Date("2025-07-01"),
          submissionDeadlineAt: new Date("2026-06-30"),
          status: "draft",
          createdBy: "system",
        },
      });
    }

    // 2. Ensure system default rubric exists
    let systemRubric = await prisma.rubricVersion.findUnique({
      where: { id: "system-default-rubric" },
    });

    if (!systemRubric) {
      await prisma.rubricVersion.create({
        data: {
          id: "system-default-rubric",
          cycleId: "base-cycle",
          version: 1,
          name: "System Default Grading Rubric",
          configJson: defaultRubricConfig,
          isActive: false,
          isFrozen: false,
          createdBy: "system",
        },
      });
    } else {
      // Overwrite the existing schema to keep it updated with codebase defaults
      await prisma.rubricVersion.update({
        where: { id: "system-default-rubric" },
        data: {
          configJson: defaultRubricConfig,
        },
      });
    }
  } catch (error) {
    console.error("Error ensuring system rubric defaults in DB:", error);
  }
}

export async function GET() {
  try {
    await ensureSystemDefaults();
    const rubrics = await prisma.rubricVersion.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        cycle: true,
      }
    });
    return NextResponse.json({ rubrics });
  } catch (error) {
    console.error("Error fetching rubrics:", error);
    return NextResponse.json({ error: "Failed to fetch rubrics" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { cycleId, version, name, configJson, isActive, createdBy } = body;

    if (!cycleId || version === undefined || !name || !configJson) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const user = await getSessionUser();

    const newRubric = await prisma.rubricVersion.create({
      data: {
        cycleId,
        version: Number(version),
        name,
        configJson,
        isActive: Boolean(isActive),
        isFrozen: false,
        createdBy: user?.name || createdBy || "admin",
      },
    });

    if (user) {
      await writeAuditLog({
        actorUserId: user.id,
        actionType: "RUBRIC_CREATED",
        entityType: "RubricVersion",
        entityId: newRubric.id,
        newValueJson: { name: newRubric.name, version: newRubric.version },
      });
    }

    return NextResponse.json({ rubric: newRubric }, { status: 201 });
  } catch (error) {
    console.error("Error creating rubric:", error);
    return NextResponse.json({ error: "Failed to create rubric" }, { status: 500 });
  }
}
