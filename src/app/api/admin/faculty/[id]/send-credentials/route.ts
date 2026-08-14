import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import { sendPasswordReset } from "@/lib/firebase-auth";
import { demoBlock } from "@/lib/demo-guard";

/**
 * Send a faculty member a link to set their own password.
 *
 * Two changes from the original beyond the provider swap:
 *
 * 1. It had no authentication whatsoever. Anyone who found the URL could POST a
 *    faculty id and make the app send mail on their behalf — an open relay
 *    pointed at real addresses, and an account-enumeration oracle besides, since
 *    a valid id answered differently from an invalid one.
 * 2. Supabase's generateLink/inviteUserByEmail are replaced by Firebase's
 *    password-reset email, which needs only the public API key.
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const actor = await prisma.user.findFirst({ where: { email: user.email } });
    if (!actor || (actor.role !== "admin" && actor.role !== "super_admin")) {
      return NextResponse.json({ error: "Admin only" }, { status: 403 });
    }

    // Frozen in the demo: this sends real mail to whatever address is on the
    // record, and a visitor can edit that address. Placed after the authz checks
    // so an anonymous caller still gets 401.
    const blocked = demoBlock("Sending credentials");
    if (blocked) return blocked;

    const faculty = await prisma.user.findUnique({ where: { id } });
    if (!faculty) {
      return NextResponse.json({ error: "Faculty not found" }, { status: 404 });
    }

    await sendPasswordReset(faculty.email);

    return NextResponse.json({
      success: true,
      message:
        "Sent. They will receive a link to set their own password and can then sign in.",
    });
  } catch (error: unknown) {
    console.error("Send credentials error:", error);
    return NextResponse.json(
      { error: "Could not send the email" },
      { status: 500 },
    );
  }
}
