import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser, writeAuditLog } from "@/lib/audit-logger";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const template = await prisma.formTemplate.findUnique({
      where: { id },
      include: {
        cycle: true,
      },
    });

    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    return NextResponse.json({ template });
  } catch (error) {
    console.error("Error fetching template:", error);
    return NextResponse.json({ error: "Failed to fetch template" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    // Only extract the fields we want to allow updating
    const updateData: any = {};
    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.instructions !== undefined) updateData.instructions = body.instructions;
    if (body.schemaJson !== undefined) updateData.schemaJson = body.schemaJson;
    if (body.updatedSchema !== undefined) updateData.updatedSchema = body.updatedSchema;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;

    const user = await getSessionUser();

    const updatedTemplate = await prisma.formTemplate.update({
      where: { id },
      data: updateData,
    });

    if (user) {
      await writeAuditLog({
        actorUserId: user.id,
        actionType: "TEMPLATE_UPDATED",
        entityType: "FormTemplate",
        entityId: id,
        newValueJson: { title: updatedTemplate.title, isActive: updatedTemplate.isActive },
      });
    }

    return NextResponse.json({ template: updatedTemplate });
  } catch (error) {
    console.error("Error updating template:", error);
    return NextResponse.json({ error: "Failed to update template" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (id === "system-default-template") {
      return NextResponse.json({ error: "The System Default Template cannot be deleted." }, { status: 400 });
    }

    const user = await getSessionUser();

    const templateToDelete = await prisma.formTemplate.findUnique({
      where: { id },
    });

    if (!templateToDelete) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    if (templateToDelete.isActive) {
      return NextResponse.json({ error: "This template is currently active and linked to an appraisal cycle. It cannot be deleted." }, { status: 400 });
    }

    const submissionCount = await prisma.facultySubmission.count({
      where: { formTemplateId: id },
    });

    if (submissionCount > 0) {
      return NextResponse.json({ error: "This template has existing faculty submissions and cannot be deleted." }, { status: 400 });
    }

    await prisma.formTemplate.delete({
      where: { id },
    });

    if (user && templateToDelete) {
      await writeAuditLog({
        actorUserId: user.id,
        actionType: "TEMPLATE_DELETED",
        entityType: "FormTemplate",
        entityId: id,
        newValueJson: { title: templateToDelete.title },
      });
    }

    return NextResponse.json({ message: "Template deleted successfully" });
  } catch (error) {
    console.error("Error deleting template:", error);
    return NextResponse.json({ error: "Failed to delete template" }, { status: 500 });
  }
}
