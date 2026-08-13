// Starter pseudo-route for Next.js App Router: src/app/api/admin/evaluation/compute/route.ts
// This must be admin/evaluator-only. Do not expose to faculty.

import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  // 1. Authenticate user and verify admin/evaluator role.
  // 2. Load selected appraisal cycle.
  // 3. Load frozen rubric version.
  // 4. Load faculty submission entries.
  // 5. Load imported student feedback records.
  // 6. Compute component scores using server-side config only.
  // 7. Apply penalty rules.
  // 8. Save draft evaluation record.
  // 9. Write audit log.

  const body = await req.json();

  return NextResponse.json({
    status: "not_implemented",
    message: "Implement this route after wiring auth, database client, rubric loader, and audit logger.",
    received: body,
  });
}
