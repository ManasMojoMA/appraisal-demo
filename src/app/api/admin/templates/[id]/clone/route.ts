import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser, writeAuditLog } from "@/lib/audit-logger";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find the original template
    const original = await prisma.formTemplate.findUnique({
      where: { id },
    });

    if (!original) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    // Find the highest version number for this cycle
    const highestVersion = await prisma.formTemplate.findFirst({
      where: { cycleId: original.cycleId },
      orderBy: { version: "desc" },
      select: { version: true },
    });

    const newVersion = (highestVersion?.version || 1) + 1;

    // Create the clone
    const clonedTemplate = await prisma.formTemplate.create({
      data: {
        cycleId: original.cycleId,
        version: newVersion,
        title: `${original.title} (Copy)`,
        description: original.description,
        instructions: original.instructions as any,
        schemaJson: original.schemaJson as any,
        updatedSchema: original.updatedSchema as any,
        isActive: false,
        createdBy: user.name,
      },
    });

    await writeAuditLog({
      actorUserId: user.id,
      actionType: "TEMPLATE_CREATED",
      entityType: "FormTemplate",
      entityId: clonedTemplate.id,
      newValueJson: { title: clonedTemplate.title, version: clonedTemplate.version, clonedFromId: id },
    });

    return NextResponse.json({ success: true, template: clonedTemplate });
  } catch (error) {
    console.error("Error cloning template:", error);
    return NextResponse.json({ error: "Failed to clone template" }, { status: 500 });
  }
}
