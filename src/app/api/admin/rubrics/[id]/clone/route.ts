import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser, writeAuditLog } from "@/lib/audit-logger";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const existingRubric = await prisma.rubricVersion.findUnique({
      where: { id },
    });

    if (!existingRubric) {
      return NextResponse.json({ error: "Rubric not found" }, { status: 404 });
    }

    const user = await getSessionUser();

    // Determine new version number (find max version for base-cycle)
    const baseCycleRubrics = await prisma.rubricVersion.findMany({
      where: { cycleId: "base-cycle" },
      orderBy: { version: "desc" },
      take: 1,
    });
    
    const newVersion = baseCycleRubrics.length > 0 ? baseCycleRubrics[0].version + 1 : 1;
    const newName = `${existingRubric.name} (Copy v${newVersion})`;

    const newRubric = await prisma.rubricVersion.create({
      data: {
        cycleId: "base-cycle", // Always clone to base-cycle as draft
        version: newVersion,
        name: newName,
        configJson: existingRubric.configJson || {},
        isActive: false,
        isFrozen: false,
        createdBy: user?.name || "admin",
      },
    });

    if (user) {
      await writeAuditLog({
        actorUserId: user.id,
        actionType: "RUBRIC_CLONED",
        entityType: "RubricVersion",
        entityId: newRubric.id,
        newValueJson: { name: newRubric.name, version: newRubric.version, clonedFrom: existingRubric.id },
      });
    }

    return NextResponse.json({ rubric: newRubric }, { status: 201 });
  } catch (error) {
    console.error("Error cloning rubric:", error);
    return NextResponse.json({ error: "Failed to clone rubric" }, { status: 500 });
  }
}
