import { PrismaClient } from "@prisma/client";

/**
 * Demo seed.
 *
 * Creates the four demo logins in Firebase, mirrors them into Postgres, and then
 * builds one appraisal cycle with enough substance that each role has something
 * real to look at.
 *
 * The part worth getting right is the dean's moderation view. Moderation exists
 * to catch an evaluator who scores consistently harsher or softer than their
 * peers, so the seed deliberately gives the two evaluators different habits —
 * one runs about twelve marks below the other on comparable submissions. With
 * uniform scores the screen renders but demonstrates nothing.
 *
 * Every name, course, publication and score here is invented.
 */

const prisma = new PrismaClient();

const API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY!;
const IDENTITY = "https://identitytoolkit.googleapis.com/v1";

/** Create the Firebase account, or recover its uid if a previous run made it. */
async function ensureAuthUser(email: string, password: string): Promise<string> {
  const signUp = await fetch(`${IDENTITY}/accounts:signUp?key=${API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  });
  const created = await signUp.json();
  if (signUp.ok) return created.localId as string;

  if (created?.error?.message !== "EMAIL_EXISTS") {
    throw new Error(`${email}: ${created?.error?.message ?? signUp.status}`);
  }

  // Already there from an earlier run. Sign in to recover the uid — the password
  // is the one this seed set, so this doubles as a check that the role button
  // still opens the account.
  const signIn = await fetch(
    `${IDENTITY}/accounts:signInWithPassword?key=${API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    },
  );
  const existing = await signIn.json();
  if (!signIn.ok) {
    throw new Error(
      `${email} exists in Firebase but the seed password no longer opens it ` +
        `(${existing?.error?.message}). Delete it in the console and re-run.`,
    );
  }
  return existing.localId as string;
}

const DEMO_ACCOUNTS = [
  {
    key: "FACULTY",
    email: process.env.NEXT_PUBLIC_DEMO_FACULTY_EMAIL!,
    password: process.env.NEXT_PUBLIC_DEMO_FACULTY_PASSWORD!,
    name: "Dr Anita Rao",
    role: "faculty" as const,
    department: "Marketing",
    employeeCode: "NB-1042",
  },
  {
    key: "EVALUATOR",
    email: process.env.NEXT_PUBLIC_DEMO_EVALUATOR_EMAIL!,
    password: process.env.NEXT_PUBLIC_DEMO_EVALUATOR_PASSWORD!,
    name: "Dr Peter Whitfield",
    role: "evaluator" as const,
    department: "Finance",
    employeeCode: "NB-1008",
  },
  {
    key: "DEAN",
    email: process.env.NEXT_PUBLIC_DEMO_DEAN_EMAIL!,
    password: process.env.NEXT_PUBLIC_DEMO_DEAN_PASSWORD!,
    name: "Prof Miriam Castellanos",
    role: "admin" as const,
    department: "Office of the Dean",
    employeeCode: "NB-1001",
  },
  {
    key: "ADMIN",
    email: process.env.NEXT_PUBLIC_DEMO_ADMIN_EMAIL!,
    password: process.env.NEXT_PUBLIC_DEMO_ADMIN_PASSWORD!,
    name: "Sandra Okoye",
    role: "super_admin" as const,
    department: "Appraisal Office",
    employeeCode: "NB-1000",
  },
];

/** Extra faculty so the evaluator and dean screens are not one-row tables. */
const EXTRA_FACULTY = [
  { name: "Dr Ibrahim Nasser", department: "Operations", employeeCode: "NB-1103" },
  { name: "Dr Leena Varghese", department: "Marketing", employeeCode: "NB-1119" },
  { name: "Dr Tomas Ferreira", department: "Economics", employeeCode: "NB-1127" },
  { name: "Dr Grace Mbeki", department: "Finance", employeeCode: "NB-1134" },
  { name: "Dr Ravi Chandran", department: "Operations", employeeCode: "NB-1141" },
];

const COURSES: [string, string][] = [
  ["Consumer Behaviour", "MK301"],
  ["Operations Strategy", "OP402"],
  ["Brand Management", "MK318"],
  ["Macroeconomic Policy", "EC205"],
  ["Corporate Finance", "FN301"],
  ["Supply Chain Analytics", "OP415"],
];

async function main() {
  if (!API_KEY) throw new Error("NEXT_PUBLIC_FIREBASE_API_KEY is not set");

  console.log("Seeding…\n");

  // ── People ────────────────────────────────────────────────────────────────
  const users: Record<string, { id: string; name: string }> = {};

  for (const a of DEMO_ACCOUNTS) {
    if (!a.email || !a.password) {
      throw new Error(`Missing env for the ${a.key} demo account`);
    }
    const uid = await ensureAuthUser(a.email, a.password);
    const u = await prisma.user.upsert({
      where: { email: a.email },
      update: { supabaseId: uid, status: "active", role: a.role },
      create: {
        email: a.email,
        supabaseId: uid,
        name: a.name,
        role: a.role,
        department: a.department,
        employeeCode: a.employeeCode,
        status: "active",
      },
    });
    users[a.key] = { id: u.id, name: u.name };
    console.log(`  ${a.key.padEnd(10)} ${a.name}`);
  }

  // A second evaluator, with no login. The dean's moderation view needs two
  // scorers to compare; only one of them needs a button.
  await prisma.user.upsert({
    where: { email: "second.evaluator@northbridge.demo" },
    update: {},
    create: {
      email: "second.evaluator@northbridge.demo",
      name: "Dr Helen Ashworth",
      role: "evaluator",
      department: "Economics",
      employeeCode: "NB-1015",
      status: "active",
    },
  });

  const facultyRows = [{ id: users.FACULTY.id, name: users.FACULTY.name }];
  for (const f of EXTRA_FACULTY) {
    const u = await prisma.user.upsert({
      where: { email: `${f.employeeCode.toLowerCase()}@northbridge.demo` },
      update: {},
      create: {
        email: `${f.employeeCode.toLowerCase()}@northbridge.demo`,
        name: f.name,
        role: "faculty",
        department: f.department,
        employeeCode: f.employeeCode,
        status: "active",
      },
    });
    facultyRows.push({ id: u.id, name: u.name });
  }
  console.log(`  ${facultyRows.length} faculty, 2 evaluators\n`);

  // ── Cycle ─────────────────────────────────────────────────────────────────
  // Open, with the deadline ahead, so the Faculty seat can actually submit
  // rather than landing on a closed cycle with nothing to do.
  const now = new Date();

  // The academic year runs July to June. Derive the label from the dates rather
  // than writing it out: the first version of this seed hardcoded "2025–26" next
  // to dates computed from new Date(), so the moment the calendar rolled over,
  // a cycle labelled 2025–26 was showing a July 2026 – June 2027 timeline.
  const acadStart = now.getUTCMonth() >= 6 ? now.getUTCFullYear() : now.getUTCFullYear() - 1;
  const academicYear = `${acadStart}–${String(acadStart + 1).slice(2)}`;

  // Built in UTC on purpose. new Date(y, 6, 1) is midnight *local*, which in
  // IST is 18:30 the previous day in UTC — so the timeline rendered as
  // "Jun 30 – Jun 29" instead of "Jul 1 – Jun 30" depending on who was looking.
  const cycleFields = {
    name: `Annual Appraisal ${academicYear}`,
    academicYear,
    startDate: new Date(Date.UTC(acadStart, 6, 1)),
    endDate: new Date(Date.UTC(acadStart + 1, 5, 30)),
    submissionOpenAt: new Date(now.getTime() - 21 * 864e5),
    submissionDeadlineAt: new Date(now.getTime() + 21 * 864e5),
    status: "open" as const,
  };

  const cycle = await prisma.appraisalCycle.upsert({
    where: { id: "demo-cycle" },
    update: cycleFields,
    create: { id: "demo-cycle", ...cycleFields, createdBy: users.ADMIN.id },
  });

  const template = await prisma.formTemplate.upsert({
    where: { cycleId_version: { cycleId: cycle.id, version: 1 } },
    update: { isActive: true },
    create: {
      cycleId: cycle.id,
      version: 1,
      title: "Faculty Self-Appraisal 2025–26",
      description:
        "Record your teaching, research, innovation and service for the year. Attach evidence where you have it.",
      instructions: [
        "Every claim should carry evidence — a DOI, a certificate, a letter.",
        "Entries left in draft after the deadline are not evaluated.",
        "Student feedback is added by the appraisal office; you do not enter it.",
      ],
      schemaJson: {
        schemaVersion: "1.0",
        categories: [
          {
            key: "teaching",
            label: "Teaching",
            description: "Courses delivered this cycle.",
            canBeEnabledByFaculty: true,
            minEntriesWhenEnabled: 1,
            fields: [
              { key: "course", label: "Course", type: "text", required: true },
              { key: "code", label: "Course code", type: "text", required: true },
              { key: "students", label: "Students taught", type: "number" },
              {
                key: "innovation",
                label: "What you changed this year",
                type: "textarea",
              },
            ],
          },
          {
            key: "research",
            label: "Research & publications",
            description: "Papers, chapters and funded work.",
            canBeEnabledByFaculty: true,
            minEntriesWhenEnabled: 1,
            fields: [
              { key: "title", label: "Title", type: "text", required: true },
              { key: "venue", label: "Journal or conference", type: "text" },
              {
                key: "indexing",
                label: "Indexing",
                type: "select",
                options: ["Scopus", "WoS", "ABDC-A", "ABDC-B", "Other"],
              },
              { key: "doi", label: "DOI or link", type: "text" },
            ],
          },
          {
            key: "service",
            label: "Institutional service",
            description: "Committees and administrative roles.",
            canBeEnabledByFaculty: true,
            minEntriesWhenEnabled: 1,
            fields: [
              { key: "role", label: "Role held", type: "text", required: true },
              { key: "hours", label: "Approximate hours", type: "number" },
            ],
          },
        ],
      },
      isActive: true,
      createdBy: users.ADMIN.id,
    },
  });

  // ── Rubric — never visible to faculty ─────────────────────────────────────
  const rubric = await prisma.rubricVersion.upsert({
    where: { cycleId_version: { cycleId: cycle.id, version: 1 } },
    update: { isActive: true },
    create: {
      cycleId: cycle.id,
      version: 1,
      name: "Institute Base Rubric v1",
      configJson: {
        weights: {
          teachingStudentFeedback: 30,
          academicDelivery: 20,
          innovation: 10,
          research: 30,
          service: 10,
        },
        bands: [
          { min: 85, label: "Outstanding" },
          { min: 70, label: "Exceeds expectations" },
          { min: 55, label: "Meets expectations" },
          { min: 0, label: "Below expectations" },
        ],
        note: "Faculty never see this. Released only by explicit admin action.",
      },
      isActive: true,
      isFrozen: false,
      createdBy: users.ADMIN.id,
    },
  });

  // ── Submissions and evaluations ───────────────────────────────────────────
  let submitted = 0;
  let evaluated = 0;

  for (let i = 0; i < facultyRows.length; i++) {
    const f = facultyRows[i];
    const [course, code] = COURSES[i % COURSES.length];

    // Leave the demo faculty member's own submission in draft, so signing in as
    // Faculty lands on something to finish rather than a read-only page.
    const isDemoFaculty = f.id === users.FACULTY.id;

    const already = await prisma.facultySubmission.findFirst({
      where: { cycleId: cycle.id, facultyId: f.id },
    });
    if (already) continue;

    const sub = await prisma.facultySubmission.create({
      data: {
        cycleId: cycle.id,
        facultyId: f.id,
        formTemplateId: template.id,
        status: isDemoFaculty ? "draft" : "submitted",
        submittedAt: isDemoFaculty
          ? null
          : new Date(now.getTime() - (i + 2) * 864e5),
        entries: {
          create: [
            {
              categoryKey: "teaching",
              entryIndex: 0,
              dataJson: {
                course,
                code,
                students: 40 + ((i * 7) % 35),
                innovation:
                  i % 2 === 0
                    ? "Replaced the end-term essay with a live client brief."
                    : "Moved to weekly problem sets with peer marking.",
              },
              verificationStatus: isDemoFaculty ? "not_reviewed" : "verified",
            },
            {
              categoryKey: "research",
              entryIndex: 0,
              dataJson: {
                title:
                  i % 2 === 0
                    ? "Price sensitivity in subscription renewals"
                    : "Buffer placement under demand volatility",
                venue:
                  i % 2 === 0
                    ? "Journal of Consumer Research"
                    : "Operations Review",
                indexing: i % 3 === 0 ? "ABDC-A" : "Scopus",
                doi: `10.0000/demo.2025.${100 + i}`,
              },
              verificationStatus: isDemoFaculty ? "not_reviewed" : "verified",
            },
            {
              categoryKey: "service",
              entryIndex: 0,
              dataJson: {
                role:
                  i % 2 === 0 ? "Admissions panel member" : "Curriculum committee",
                hours: 30 + ((i * 11) % 40),
              },
              verificationStatus: "not_reviewed",
            },
          ],
        },
      },
    });

    if (isDemoFaculty) continue;
    submitted++;

    // Alternate evaluators and give them different habits. Whitfield scores
    // generously; Ashworth runs roughly twelve marks tighter on comparable work.
    // That gap is exactly what the dean's moderation screen exists to surface.
    const harsh = i % 2 === 1;
    const base = harsh ? 62 : 74;
    const jitter = ((i * 13) % 9) - 4;
    const pts = base + jitter;

    const teaching = Math.min(30, Math.round(pts * 0.3));
    const delivery = Math.min(20, Math.round(pts * 0.2));
    const innovation = Math.min(10, Math.round(pts * 0.1));
    const research = Math.min(
      30,
      Math.round((pts + (i % 3 === 0 ? 8 : 0)) * 0.3),
    );
    const service = Math.min(10, Math.round(pts * 0.1));

    await prisma.facultyEvaluation.create({
      data: {
        cycleId: cycle.id,
        rubricVersionId: rubric.id,
        facultyId: f.id,
        submissionId: sub.id,
        teachingStudentFeedbackMarks: teaching,
        academicDeliveryMarks: delivery,
        innovationMarks: innovation,
        researchMarks: research,
        serviceMarks: service,
        penaltyMarks: 0,
        finalScore: teaching + delivery + innovation + research + service,
        evaluatorNotes: harsh
          ? "Solid delivery. Research output is thin against the band."
          : "Strong year — the client-brief change is worth repeating.",
        finalStatus: "draft",
      },
    });
    evaluated++;
  }

  console.log(`  cycle "${cycle.name}" — open, deadline in 21 days`);
  console.log(
    `  ${submitted} submissions in, 1 left in draft for the Faculty seat`,
  );
  console.log(
    `  ${evaluated} evaluations across 2 evaluators with different habits`,
  );
  console.log(`  rubric v1 active, hidden from faculty\n`);
  console.log("Done.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
