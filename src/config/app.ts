/**
 * Branding and demo configuration.
 *
 * Everything here was hardcoded across a dozen components: a real university's
 * name, its email domain, its logo, and a real staff address in the login page's
 * "need help?" link. None of that can ship in a public demo, so it is all
 * env-driven now with neutral defaults — the deployed demo and a real deployment
 * differ by configuration, not by a code change.
 *
 * Nothing in this file may contain a real institution, a real person, or a real
 * email address.
 */

export const brand = {
  organisation: process.env.NEXT_PUBLIC_ORG_NAME || "Northbridge Institute",
  department: process.env.NEXT_PUBLIC_ORG_DEPARTMENT || "School of Management",
  productName: process.env.NEXT_PUBLIC_PRODUCT_NAME || "Faculty Appraisal Portal",
  /** Shown on the login page's help link. Never a real person's address. */
  supportEmail:
    process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "appraisal.support@northbridge.demo",
};

/** Domain used in placeholder text and sample CSVs. Not a security control. */
export const STAFF_EMAIL_DOMAIN =
  process.env.NEXT_PUBLIC_STAFF_EMAIL_DOMAIN || "northbridge.demo";

/**
 * Demo mode. When on, the login screen offers one-click role buttons instead of
 * asking a visitor to type credentials they were never given.
 *
 * This portal is the one where roles matter most: hidden rubrics and dean
 * moderation only make sense when you can see the same cycle through four
 * different sets of eyes. A single shared login would hide the entire point.
 */
export const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

/**
 * Account management is frozen while the demo is on, and enforced server-side —
 * not merely hidden here.
 *
 * The role buttons are public, so anyone holds an admin session. Left open, a
 * visitor could create a super_admin under an address they control, which
 * survives every password rotation, or delete the demo accounts and break the
 * demo for everyone after them. The account is the asset; the invented appraisal
 * data behind it is not the point.
 *
 * Cycles, templates, submissions, rubrics and evaluations all stay fully
 * editable. Those are what a visitor came to see.
 */
export const ACCOUNT_MANAGEMENT_LOCKED = DEMO_MODE;

export interface DemoRole {
  key: string;
  label: string;
  blurb: string;
  email: string;
  password: string;
  role: "faculty" | "evaluator" | "admin" | "super_admin";
}

/**
 * Accounts created in Firebase Auth at seed time. Public by design: they exist
 * so a visitor can look around without asking for credentials. Acceptable only
 * because every record behind them is invented and they are privileged no
 * further than this one demo project.
 *
 * Next.js only inlines statically analysable `process.env.X` member expressions,
 * so each variable must be written out rather than built from a loop.
 */
const ALL_DEMO_ROLES: DemoRole[] = [
  {
    key: "faculty",
    label: "Explore as Faculty",
    blurb: "Fill in a self-appraisal, attach evidence, submit before the deadline",
    email: process.env.NEXT_PUBLIC_DEMO_FACULTY_EMAIL || "",
    password: process.env.NEXT_PUBLIC_DEMO_FACULTY_PASSWORD || "",
    role: "faculty",
  },
  {
    key: "evaluator",
    label: "Explore as Evaluator",
    blurb: "Score submissions against a rubric the faculty member cannot see",
    email: process.env.NEXT_PUBLIC_DEMO_EVALUATOR_EMAIL || "",
    password: process.env.NEXT_PUBLIC_DEMO_EVALUATOR_PASSWORD || "",
    role: "evaluator",
  },
  {
    key: "dean",
    label: "Explore as Dean",
    blurb: "Moderate scores across evaluators and finalise the cycle",
    email: process.env.NEXT_PUBLIC_DEMO_DEAN_EMAIL || "",
    password: process.env.NEXT_PUBLIC_DEMO_DEAN_PASSWORD || "",
    role: "admin",
  },
  {
    key: "admin",
    label: "Explore as Admin",
    blurb: "Open cycles, build forms, set rubrics and deadlines",
    email: process.env.NEXT_PUBLIC_DEMO_ADMIN_EMAIL || "",
    password: process.env.NEXT_PUBLIC_DEMO_ADMIN_PASSWORD || "",
    role: "super_admin",
  },
];

/** A role with no password configured would render a button that cannot sign in. */
export const DEMO_ROLES: DemoRole[] = ALL_DEMO_ROLES.filter(
  (r) => r.email && r.password,
);
