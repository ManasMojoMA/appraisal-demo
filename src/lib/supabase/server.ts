import { cookies } from "next/headers";
import {
  lookupUser,
  refreshIdToken,
  signInWithPassword,
  sendPasswordReset,
  updatePassword,
  type FirebaseUser,
} from "@/lib/firebase-auth";

/**
 * Server-side auth client. Firebase underneath, Supabase's shape on top.
 *
 * The name and signature are deliberately unchanged. Auth is touched in thirty
 * files here — `supabase.auth.getUser()` alone appears twenty-one times — and
 * rewriting every one of them to move provider would have been a large, risky
 * diff through code neither well covered by tests nor easy to exercise by hand.
 * Keeping the seam means the swap is confined to two files and every call site
 * still reads the same.
 *
 * Only the methods this app actually calls are implemented. The rest are absent
 * on purpose: a stub that silently succeeds is worse than a missing method,
 * because it fails at runtime instead of at the type check.
 */

const ID_COOKIE = "fb-id-token";
const REFRESH_COOKIE = "fb-refresh-token";

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

type UserResult = { data: { user: FirebaseUser | null }; error: Error | null };

export async function createClient() {
  const store = await cookies();

  /** Writing cookies throws inside a Server Component; Next only allows it from
   *  a Route Handler or Server Action. Swallowed for the same reason the
   *  original Supabase adapter swallowed it. */
  const trySet = (name: string, value: string, maxAge?: number) => {
    try {
      store.set(name, value, maxAge ? { ...COOKIE_OPTS, maxAge } : COOKIE_OPTS);
    } catch {
      /* Server Component render — middleware refreshes instead. */
    }
  };

  const resolveUser = async (): Promise<FirebaseUser | null> => {
    const idToken = store.get(ID_COOKIE)?.value;
    if (idToken) {
      const user = await lookupUser(idToken);
      if (user) return user;
    }

    // ID token missing or past its hour. Spend the refresh token on a new one.
    const refresh = store.get(REFRESH_COOKIE)?.value;
    if (!refresh) return null;

    const next = await refreshIdToken(refresh);
    if (!next) return null;

    trySet(ID_COOKIE, next.idToken, 60 * 60);
    trySet(REFRESH_COOKIE, next.refreshToken, 60 * 60 * 24 * 14);
    return lookupUser(next.idToken);
  };

  return {
    auth: {
      async getUser(): Promise<UserResult> {
        const user = await resolveUser();
        return { data: { user }, error: null };
      },

      async getSession(): Promise<{
        data: { session: { user: FirebaseUser } | null };
        error: Error | null;
      }> {
        const user = await resolveUser();
        return { data: { session: user ? { user } : null }, error: null };
      },

      async signInWithPassword({
        email,
        password,
      }: {
        email: string;
        password: string;
      }) {
        try {
          const r = await signInWithPassword(email, password);
          trySet(ID_COOKIE, r.idToken, 60 * 60);
          trySet(REFRESH_COOKIE, r.refreshToken, 60 * 60 * 24 * 14);
          return { data: { user: r.user }, error: null };
        } catch (e) {
          // Deliberately generic. Firebase distinguishes EMAIL_NOT_FOUND from
          // INVALID_PASSWORD, which tells an attacker which addresses exist.
          return {
            data: { user: null },
            error: new Error("Invalid email or password."),
          };
        }
      },

      async signOut() {
        trySet(ID_COOKIE, "", 0);
        trySet(REFRESH_COOKIE, "", 0);
        return { error: null };
      },

      async resetPasswordForEmail(email: string) {
        try {
          await sendPasswordReset(email);
        } catch {
          // Never reveal whether the address is registered.
        }
        return { data: {}, error: null };
      },

      async updateUser({ password }: { password?: string }) {
        const idToken = store.get(ID_COOKIE)?.value;
        if (!idToken || !password) {
          return { data: { user: null }, error: new Error("Not signed in.") };
        }
        try {
          await updatePassword(idToken, password);
          return { data: { user: await lookupUser(idToken) }, error: null };
        } catch (e) {
          return {
            data: { user: null },
            error: new Error(
              e instanceof Error ? e.message : "Could not update password.",
            ),
          };
        }
      },
    },
  };
}
