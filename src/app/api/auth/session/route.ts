import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** Current user, or null. Route handlers can write cookies, so a token that
 *  expired mid-session gets refreshed here rather than silently signing the
 *  visitor out. */
export async function POST() {
  const auth = await createClient();
  const { data } = await auth.auth.getUser();
  return NextResponse.json({ user: data.user });
}
