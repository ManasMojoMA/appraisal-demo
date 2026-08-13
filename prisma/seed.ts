import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // 1. Create a dummy admin user
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@northbridge.demo" },
    update: {},
    create: {
      email: "admin@northbridge.demo",
      name: "Admin User",
      role: "super_admin",
      department: "Administration",
      supabaseId: "admin-auth-id-placeholder", // To be updated when auth is linked
    },
  });
  console.log(`Created admin user: ${adminUser.email}`);

  // 2. Create a dummy faculty user
  const facultyUser = await prisma.user.upsert({
    where: { email: "faculty@northbridge.demo" },
    update: {},
    create: {
      email: "faculty@northbridge.demo",
      name: "Faculty User",
      role: "faculty",
      department: "Computer Science",
      employeeCode: "EMP1001",
      supabaseId: "faculty-auth-id-placeholder",
    },
  });
  console.log(`Created faculty user: ${facultyUser.email}`);

  // 3. Create an appraisal cycle
  const cycle = await prisma.appraisalCycle.create({
    data: {
      name: "Annual Appraisal 2025-26",
      academicYear: "2025-26",
      startDate: new Date("2025-07-01"),
      endDate: new Date("2026-06-30"),
      submissionOpenAt: new Date("2026-05-01"),
      submissionDeadlineAt: new Date("2026-06-15"),
      status: "open",
      createdBy: adminUser.id,
    },
  });
  console.log(`Created appraisal cycle: ${cycle.name}`);

  // 4. Create form template using the JSON from config
  const formTemplate = await prisma.formTemplate.create({
    data: {
      cycleId: cycle.id,
      version: 1,
      title: "Faculty Self-Review Form 2025-26",
      description: "Annual self-review for Northbridge Institute faculty.",
      instructions: [
        "Please complete all enabled categories.",
        "Ensure all URLs are accessible."
      ],
      schemaJson: {
        schemaVersion: "1.0",
        categories: [
          {
            key: "service_contribution",
            label: "Service Contribution",
            description: "Institutional roles and committee memberships.",
            canBeEnabledByFaculty: true,
            minEntriesWhenEnabled: 1,
            fields: [
              {
                key: "role_name",
                label: "Role/Committee Name",
                type: "text",
                required: true,
              },
            ],
          },
        ],
      },
      isActive: true,
      createdBy: adminUser.id,
    },
  });
  console.log(`Created form template version ${formTemplate.version}`);

  console.log("Seeding complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
