import "server-only";
import { NextResponse } from "next/server";

/**
 * Blocks account-management writes while the app runs as a public demo.
 *
 * The four role buttons are public, so anyone holds an admin — in fact a
 * super_admin — session. Left open, a visitor could create an account under an
 * address they control, which survives every password rotation, or delete the
 * demo logins and break the demo for everyone after them. The invented appraisal
 * records were never what was at risk; the accounts are.
 *
 * This runs server-side, inside the route handlers. Hiding buttons protects
 * nothing: these are plain HTTP endpoints and a session cookie is enough to call
 * them directly. The UI hiding is courtesy; this is the control.
 *
 * Everything that makes the portal worth showing — cycles, form templates,
 * submissions, evidence, rubric versions, evaluations, moderation and deadline
 * overrides — stays fully editable.
 */

/** Reads the same flag the client uses. It is a mode, not a secret. */
export const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

/**
 * Returns a 403 when account management is attempted in demo mode, or null when
 * the caller should proceed.
 *
 * Call this AFTER the route's existing authentication and role checks. Placed
 * before them, an unauthenticated caller would get "demo restricted" instead of
 * 401 — which confirms the endpoint exists and skips the authorisation work
 * behind it.
 */
export function demoBlock(action = "That action"): NextResponse | null {
  if (!DEMO_MODE) return null;
  return NextResponse.json(
    {
      error: "demo_restricted",
      message:
        `${action} is disabled in this demo. Account management is frozen because ` +
        `the role logins are public — everything else is fully editable.`,
    },
    { status: 403 },
  );
}
