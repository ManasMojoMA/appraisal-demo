const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const newAcademicFields = [
  { key: "program_name", label: "Program Name", type: "text", required: true, placeholder: "BBA / MBA" },
  { key: "semester", label: "Semester", type: "select", required: true, options: ["1", "2", "3", "4", "5", "6"] },
  { key: "course_name", label: "Course Name", type: "text", required: true },
  { key: "section_number", label: "Section number", type: "text", required: true },
  { key: "credits", label: "Course Credits", type: "number", required: true },
  { key: "description", label: "Innovation in pedagogy: Live projects, guest sessions, experiential learning, etc.", type: "textarea", required: true },
  { key: "challenges", label: "Any challenges you faced during your in-class sessions", type: "textarea", required: true, placeholder: "Student related / Pedagogy related / Technology related etc." }
];

const newSubstitutionFields = [
  { key: "classes_taken_for_others", label: "Number of substitution classes you took on behalf of other faculty members", type: "number", required: true },
  { key: "absent_days_requested", label: "Number of absent days for which you requested substitution from other faculty members", type: "number", required: true },
  { key: "classes_requested", label: "Number of classes for which you requested substitution during your absence", type: "number", required: true },
  { key: "reason", label: "Reason of substitution (list all reasons)", type: "textarea", required: true }
];

async function updateSchemas() {
  const templates = await prisma.formTemplate.findMany();
  let updatedCount = 0;

  for (const template of templates) {
    if (template.schemaJson && template.schemaJson.categories) {
      const categories = template.schemaJson.categories;
      let modified = false;

      for (const cat of categories) {
        if (cat.key === "academic_delivery") {
          cat.fields = newAcademicFields;
          modified = true;
        }
        if (cat.key === "substitution_details") {
          cat.fields = newSubstitutionFields;
          modified = true;
        }
      }

      if (modified) {
        await prisma.formTemplate.update({
          where: { id: template.id },
          data: { schemaJson: template.schemaJson }
        });
        updatedCount++;
      }
    }
  }
  console.log(`Updated ${updatedCount} form templates.`);
}

updateSchemas()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
