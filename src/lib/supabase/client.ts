"use client";

/**
 * Browser-side auth client. Firebase underneath, Supabase's shape on top.
 *
 * Every method here is a thin call to a route handler under /api/auth rather
 * than a direct call to Firebase. That is deliberate: the session lives in
 * httpOnly cookies, which browser JavaScript cannot write. Signing in from the
 * client and keeping the token in localStorage would work and would also hand
 * any injected script a copy of the session, so the token is never exposed to
 * page scripts at all.
 *
 * Same reasoning as the server adapter — keeping `createClient()`'s shape means
 * the five components that use it did not have to change.
 */

interface AuthUser {
  id: string;
  email: string;
  emailVerified: boolean;
}

async function post<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {}),
  });
  return (await res.json().catch(() => ({}))) as T;
}

export function createClient() {
  return {
    auth: {
      async getUser() {
        const r = await post<{ user: AuthUser | null }>("/api/auth/session");
        return { data: { user: r.user ?? null }, error: null };
      },

      async getSession() {
        const r = await post<{ user: AuthUser | null }>("/api/auth/session");
        return {
          data: { session: r.user ? { user: r.user } : null },
          error: null,
        };
      },

      async signInWithPassword({
        email,
        password,
      }: {
        email: string;
        password: string;
      }) {
        const r = await post<{ user?: AuthUser; error?: string }>(
          "/api/auth/signin",
          { email, password },
        );
        return {
          data: { user: r.user ?? null },
          error: r.error ? new Error(r.error) : null,
        };
      },

      async signOut() {
        await post("/api/auth/signout");
        return { error: null };
      },

      async resetPasswordForEmail(email: string) {
        await post("/api/auth/reset", { email });
        return { data: {}, error: null };
      },

      async updateUser({ password }: { password?: string }) {
        const r = await post<{ user?: AuthUser; error?: string }>(
          "/api/auth/update-password",
          { password },
        );
        return {
          data: { user: r.user ?? null },
          error: r.error ? new Error(r.error) : null,
        };
      },

      /**
       * Google sign-in is not wired up in the demo.
       *
       * It would need an OAuth consent screen and authorised redirect domains on
       * a project that exists to be thrown away, and the four role buttons
       * already get a visitor in without typing anything. Returning a clear
       * error beats a button that hangs.
       */
      async signInWithOAuth(_opts: unknown) {
        return {
          data: null,
          error: new Error(
            "Google sign-in is disabled in this demo — use one of the Explore buttons.",
          ),
        };
      },
    },
  };
}
