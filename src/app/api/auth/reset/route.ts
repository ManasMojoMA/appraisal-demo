import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const { email } = await req.json().catch(() => ({}));
  if (email) {
    const auth = await createClient();
    await auth.auth.resetPasswordForEmail(email);
  }
  // Always the same answer, whether or not the address is registered — the
  // difference would otherwise enumerate accounts.
  return NextResponse.json({ ok: true });
}
