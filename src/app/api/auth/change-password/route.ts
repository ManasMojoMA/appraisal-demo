import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import { signInWithPassword, updatePassword } from "@/lib/firebase-auth";
import { demoBlock } from "@/lib/demo-guard";

export async function POST(request: NextRequest) {
  try {
    // 1. Must be signed in
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await prisma.user.findFirst({ where: { email: user.email } });
    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 2. Frozen in the demo.
    //
    // Changing a demo account's password is the one self-service action that
    // breaks the demo permanently: the role button still sends the old password,
    // so the next visitor cannot get in at all. Placed after the auth check so an
    // anonymous caller still gets 401.
    const blocked = demoBlock("Changing the password");
    if (blocked) return blocked;

    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Current and new password are required" },
        { status: 400 },
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "New password must be at least 8 characters" },
        { status: 400 },
      );
    }

    // 3. Prove the current password by signing in with it. This also yields a
    //    fresh ID token, which is exactly what the password update needs — so no
    //    service account is involved.
    let idToken: string;
    try {
      const r = await signInWithPassword(user.email, currentPassword);
      idToken = r.idToken;
    } catch {
      return NextResponse.json(
        { error: "Current password is incorrect" },
        { status: 400 },
      );
    }

    try {
      await updatePassword(idToken, newPassword);
    } catch (e) {
      return NextResponse.json(
        {
          error:
            e instanceof Error && e.message.includes("WEAK_PASSWORD")
              ? "That password is too weak."
              : "Failed to update password",
        },
        { status: 400 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Change password error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
