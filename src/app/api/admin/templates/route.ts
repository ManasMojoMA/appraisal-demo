import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser, writeAuditLog } from "@/lib/audit-logger";

const hardcodedSchema = {
  schemaVersion: "1.0",
  visibility: "faculty_visible_only",
  formTitle: "Standard Faculty Appraisal Form 2025",
  formDescription: "Comprehensive annual self-review for faculty members.",
  instructions: ["Please complete all enabled categories.", "Ensure all URLs and uploads are accessible."],
  categoryActivationRule: {
    enabledCategoryMinEntries: 1,
    autoCreateFirstEntry: true,
    allAddedEntriesMustBeComplete: true,
    allowDisableCategoryBeforeSubmission: true,
  },
  categories: [
    {
      key: "academic_delivery",
      label: "Academic Delivery",
      description: "Details regarding courses taught and academic responsibilities.\nMention N/A for all the fields not applicable to you",
      canBeEnabledByFaculty: false,
      minEntriesWhenEnabled: 1,
      fields: [
        { key: "program_name", label: "Program Name", type: "text", required: true, placeholder: "BBA / MBA" },
        { key: "semester", label: "Semester", type: "select", required: true, options: ["1", "2", "3", "4", "5", "6"] },
        { key: "course_name", label: "Course Name", type: "text", required: true },
        { key: "section_number", label: "Section number", type: "text", required: true },
        { key: "credits", label: "Course Credits", type: "number", required: true },
        { key: "description", label: "Innovation in pedagogy: Live projects, guest sessions, experiential learning, etc.", type: "textarea", required: true },
        { key: "challenges", label: "Any challenges you faced during your in-class sessions", type: "textarea", required: true, placeholder: "Student related / Pedagogy related / Technology related etc." }
      ]
    },
    {
      key: "research_publications",
      label: "Research & Publications",
      description: "Journal articles, conference papers, patents, Case Study, Book Chapter, and Book.\n(These should be considered for the academic year July 2025 to June 2026 only.)\nMention N/A for all the fields not applicable to you",
      canBeEnabledByFaculty: false,
      minEntriesWhenEnabled: 1,
      fields: [
        { key: "title", label: "Publication/Research Title", type: "text", required: true },
        { key: "journal", label: "Journal/Conference Name", type: "text", required: true },
        { key: "descriptive_details", label: "Descriptive Details", type: "textarea", required: false },
        { key: "evidence_link", label: "Google Drive / OneDrive Link", type: "url", required: true, helpText: "Paste a shareable link. Ensure \"Anyone with the link\" can view it, otherwise the evaluator cannot access it and it may result in zero marks." }
      ]
    },
    {
      key: "innovation",
      label: "FDPs/MDPs/Seminars/Conferences/Workshops/etc conducted or attended",
      description: "Mention N/A for all the fields not applicable to you",
      canBeEnabledByFaculty: false,
      minEntriesWhenEnabled: 1,
      fields: [
        { key: "name", label: "Name of FDPs/MDPs/Seminars/Conferences/Workshops/etc", type: "text", required: true },
        { key: "type", label: "Type", type: "select", required: true, options: ["FDP", "MDP", "Seminar", "Conference", "Workshop", "Other"] },
        { key: "type_other", label: "Please specify Type", type: "text", required: true, visibilityLogic: { type: "Other" } },
        { key: "insights", label: "Insights", type: "textarea", required: true },
        { key: "title", label: "Title of the {{type}}", type: "text", required: true },
        { key: "start_date", label: "Start date", type: "date", required: true },
        { key: "end_date", label: "End date", type: "date", required: true },
        { key: "modality", label: "Modality", type: "select", required: true, options: ["Online", "Offline", "Hybrid"] },
        { key: "evidence_link", label: "Evidence of attendance", type: "url", required: true, helpText: "Provide Google Drive link. Make sure 'Anyone with the link' can view." },
        { key: "role", label: "Role", type: "select", required: true, options: ["Participant", "Presenter", "Session Chair", "Keynote speaker", "Other"] },
        { key: "role_other", label: "Please specify Role", type: "text", required: true, visibilityLogic: { role: "Other" } }
      ]
    },
    {
      key: "service_contribution_a",
      label: "Service Contribution Part A",
      description: "Institutional roles, committee memberships, and problem-solving contributions.\nMention N/A for all the fields not applicable to you",
      canBeEnabledByFaculty: false,
      minEntriesWhenEnabled: 1,
      fields: [
        { key: "role_name", label: "Role/Committee Name", type: "text", required: true },
        { key: "problem_solved", label: "Responsibilities Assigned to the Role", type: "text", required: true },
        { key: "start_date", label: "Start Date of Role", type: "date", required: true },
        { key: "end_date", label: "End Date of Role (Optional)", type: "date", required: false },
        { key: "action_taken", label: "Action Taken and Impact Generated", type: "textarea", required: true },
      ],
    },
    {
      key: "service_contribution_b",
      label: "Service contribution Part B",
      description: "Mention N/A for all the fields not applicable to you",
      canBeEnabledByFaculty: false,
      minEntriesWhenEnabled: 1,
      fields: [
        { 
          key: "industry_engagement", 
          label: "Industry engagement for the School", 
          type: "multi_select", 
          required: true, 
          hasDetails: true, 
          detailsPlaceholder: "Please share verifiable evidence of industry engagement, specifying the date, stakeholders involved, activity conducted, and any resulting outputs or impact",
          options: [
            "High-impact MoU", "Corporate Partnership", "Placement lead resulting in student benefit", 
            "Live Project", "Consulting Assignment", "Certification collaboration", "Guest Lecture", 
            "Industry Talk", "Arranged Panel Participation", "Industry Visit", "Arranged Field Exposure", 
            "Advisory input from industry for curriculum", "Course improvement", "Other"
          ] 
        }
      ]
    },
    {
      key: "service_contribution_c",
      label: "Service contribution Part C",
      description: "Mention N/A for all the fields not applicable to you",
      canBeEnabledByFaculty: false,
      minEntriesWhenEnabled: 1,
      fields: [
        { 
          key: "institutional_initiatives", 
          label: "Institutional initiatives for the School", 
          type: "multi_select", 
          required: true, 
          hasDetails: true,
          options: [
            "New academic process or policy development", "Student engagement initiatives", 
            "Accreditation or ranking support", "Community outreach", "School branding activities", 
            "Interdisciplinary events", "Research seminars or academic conclaves", 
            "Alumni engagement support", "Quality improvement projects", 
            "Technology/process improvement initiatives"
          ] 
        }
      ]
    },
    {
      key: "substitution_details",
      label: "Substitution Details",
      description: "Academic year July 2025 to June 2026\nMention N/A for all the fields not applicable to you",
      canBeEnabledByFaculty: false,
      minEntriesWhenEnabled: 1,
      fields: [
        { key: "classes_taken_for_others", label: "Number of substitution classes you took on behalf of other faculty members", type: "number", required: true },
        { key: "absent_days_requested", label: "Number of absent days for which you requested substitution from other faculty members", type: "number", required: true },
        { key: "classes_requested", label: "Number of classes for which you requested substitution during your absence", type: "number", required: true },
        { key: "reason", label: "Reason of substitution (list all reasons)", type: "textarea", required: true }
      ]
    }
  ],
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

    // 2. Ensure system default template exists under it
    let systemTemplate = await prisma.formTemplate.findUnique({
      where: { id: "system-default-template" },
    });

    if (!systemTemplate) {
      await prisma.formTemplate.create({
        data: {
          id: "system-default-template",
          cycleId: "base-cycle",
          version: 1,
          title: "System Default Appraisal Template (Cloneable)",
          description: "Standard appraisal template containing the initial computer science department requirements. This cannot be deleted.",
          instructions: hardcodedSchema.instructions,
          schemaJson: hardcodedSchema,
          isActive: false,
          createdBy: "system",
        },
      });
    } else {
      // Overwrite the existing schema to keep it updated with codebase defaults
      await prisma.formTemplate.update({
        where: { id: "system-default-template" },
        data: {
          schemaJson: hardcodedSchema,
          instructions: hardcodedSchema.instructions,
        },
      });
    }
  } catch (error) {
    console.error("Error ensuring system defaults in DB:", error);
  }
}

export async function GET() {
  try {
    await ensureSystemDefaults();
    const templates = await prisma.formTemplate.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        cycle: true,
      }
    });
    return NextResponse.json({ templates });
  } catch (error) {
    console.error("Error fetching templates:", error);
    return NextResponse.json({ error: "Failed to fetch templates" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { cycleId, version, title, description, instructions, schemaJson, updatedSchema, isActive, createdBy } = body;

    if (!cycleId || version === undefined || !title || !description) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const user = await getSessionUser();

    const newTemplate = await prisma.formTemplate.create({
      data: {
        cycleId,
        version: Number(version),
        title,
        description,
        instructions: instructions || {},
        schemaJson: schemaJson || {},
        updatedSchema: updatedSchema || null,
        isActive: Boolean(isActive),
        createdBy: user?.name || createdBy || "admin",
      },
    });

    if (user) {
      await writeAuditLog({
        actorUserId: user.id,
        actionType: "TEMPLATE_CREATED",
        entityType: "FormTemplate",
        entityId: newTemplate.id,
        newValueJson: { title: newTemplate.title, version: newTemplate.version },
      });
    }

    return NextResponse.json({ template: newTemplate }, { status: 201 });
  } catch (error) {
    console.error("Error creating template:", error);
    return NextResponse.json({ error: "Failed to create template" }, { status: 500 });
  }
}
