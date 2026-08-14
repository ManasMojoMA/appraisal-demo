import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  const auth = await createClient();
  await auth.auth.signOut();
  return NextResponse.json({ ok: true });
}
