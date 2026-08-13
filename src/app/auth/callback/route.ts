import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const token_hash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type");
  const next = requestUrl.searchParams.get("next") ?? "/";

  // Determine the correct base URL for redirects (works in both dev and prod)
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto") ?? "https";
  const isLocalEnv = process.env.NODE_ENV === "development";
  const baseUrl = isLocalEnv
    ? requestUrl.origin
    : forwardedHost
      ? `${forwardedProto}://${forwardedHost}`
      : requestUrl.origin;

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {}
        },
      },
    }
  );

  // --- Flow 1: PKCE code exchange (used by Google OAuth & some email flows) ---
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const { data: { user } } = await supabase.auth.getUser();

      if (user?.email) {
        const redirectPath = next !== "/" ? next : "/auth/post-login";
        return NextResponse.redirect(`${baseUrl}${redirectPath}`);
      }
    }

    // If the code exchange failed, don't return error yet — fall through to
    // check if there's also a token_hash (shouldn't happen, but be safe).
    if (!token_hash) {
      return NextResponse.redirect(`${baseUrl}/login?error=auth_failed`);
    }
  }

  // --- Flow 2: Token hash verification (used by password reset & magic link emails) ---
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type: type as any,
      token_hash,
    });

    if (!error) {
      // For password recovery, redirect to the reset-password form
      if (type === "recovery") {
        return NextResponse.redirect(`${baseUrl}/auth/reset-password`);
      }

      // For email signup confirmation or invite
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        const redirectPath = next !== "/" ? next : "/auth/post-login";
        return NextResponse.redirect(`${baseUrl}${redirectPath}`);
      }
    }

    return NextResponse.redirect(`${baseUrl}/login?error=auth_failed`);
  }

  // No code or token_hash provided
  return NextResponse.redirect(`${baseUrl}/login?error=auth_failed`);
}
