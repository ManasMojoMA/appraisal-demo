import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { CycleStatus } from "@prisma/client";
import { getSessionUser, writeAuditLog } from "@/lib/audit-logger";

export async function GET() {
  try {
    // "base-cycle" is a system container, created on demand to hold the default
    // rubrics and form templates — it is not an appraisal anyone takes part in.
    // Listing it alongside real cycles put a permanently-draft row in the table
    // with dates unrelated to anything, which reads as a bug rather than as
    // scaffolding.
    const cycles = await prisma.appraisalCycle.findMany({
      where: { id: { not: "base-cycle" } },
      orderBy: { createdAt: "desc" },
      include: {
        formTemplates: true,
      },
    });
    return NextResponse.json({ cycles });
  } catch (error) {
    console.error("Error fetching cycles:", error);
    return NextResponse.json({ error: "Failed to fetch cycles" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, academicYear, startDate, endDate, submissionOpenAt, submissionDeadlineAt, createdBy, templateId, rubricId } = body;

    if (!name || !academicYear || !startDate || !endDate) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const user = await getSessionUser();

    const newCycle = await prisma.appraisalCycle.create({
      data: {
        name,
        academicYear,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        submissionOpenAt: new Date(submissionOpenAt || startDate),
        submissionDeadlineAt: new Date(submissionDeadlineAt || endDate),
        status: CycleStatus.draft,
        createdBy: user?.name || createdBy || "admin",
      },
    });

    if (templateId) {
      // Unlink the template from any previous cycle and link to new cycle
      await prisma.formTemplate.update({
        where: { id: templateId },
        data: { cycleId: newCycle.id, isActive: true }, // Should activate it since cycle is about to use it, actually Cycle status handles activation later, but for now we set it to active/linked. Wait, form templates are active if linked.
      });
    }

    if (rubricId) {
      // Unlink the rubric from any previous cycle and link to new cycle
      await prisma.rubricVersion.update({
        where: { id: rubricId },
        data: { cycleId: newCycle.id, isActive: true },
      });
    }

    if (user) {
      await writeAuditLog({
        actorUserId: user.id,
        actionType: "CYCLE_CREATED",
        entityType: "AppraisalCycle",
        entityId: newCycle.id,
        newValueJson: { name, academicYear, status: "draft" },
      });
    }

    return NextResponse.json({ cycle: newCycle }, { status: 201 });
  } catch (error) {
    console.error("Error creating cycle:", error);
    return NextResponse.json({ error: "Failed to create cycle" }, { status: 500 });
  }
}
