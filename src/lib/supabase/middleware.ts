import { NextResponse, type NextRequest } from "next/server";
import { lookupUser, refreshIdToken } from "@/lib/firebase-auth";

const ID_COOKIE = "fb-id-token";
const REFRESH_COOKIE = "fb-refresh-token";

/**
 * Guards /faculty, /admin and /evaluator, and renews the ID token when it has
 * aged out.
 *
 * Middleware is the only place a token refresh can persist reliably, because a
 * Server Component render cannot write cookies. Without this, a visitor who left
 * a tab open for an hour would be bounced to /login on their next click even
 * though their refresh token was still perfectly good.
 *
 * A timeout wraps the network calls. Middleware runs on every matched request,
 * so if Firebase were slow or unreachable every page in the app would hang
 * rather than only the ones needing a session — treat an unanswered lookup as
 * "not signed in" and let the route guards decide.
 */
const AUTH_TIMEOUT_MS = 3500;

function withTimeout<T>(p: Promise<T>, fallback: T): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((resolve) =>
      setTimeout(() => resolve(fallback), AUTH_TIMEOUT_MS),
    ),
  ]);
}

export async function updateSession(request: NextRequest) {
  const response = NextResponse.next({ request });

  const idToken = request.cookies.get(ID_COOKIE)?.value;
  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;

  let signedIn = false;

  if (idToken) {
    signedIn = Boolean(await withTimeout(lookupUser(idToken), null));
  }

  if (!signedIn && refreshToken) {
    const next = await withTimeout(refreshIdToken(refreshToken), null);
    if (next) {
      const secure = process.env.NODE_ENV === "production";
      response.cookies.set(ID_COOKIE, next.idToken, {
        httpOnly: true,
        secure,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60,
      });
      response.cookies.set(REFRESH_COOKIE, next.refreshToken, {
        httpOnly: true,
        secure,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 14,
      });
      signedIn = true;
    }
  }

  const pathname = request.nextUrl.pathname;
  const isProtectedRoute =
    pathname.startsWith("/faculty") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/evaluator");

  if (!signedIn && isProtectedRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return response;
}
