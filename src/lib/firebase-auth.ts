/**
 * Firebase Auth via its REST API, with no Admin SDK and no service account.
 *
 * Why REST rather than firebase-admin: verifying a session only needs the public
 * API key plus Google's own lookup endpoint, so there is no service-account JSON
 * to store in an env var, leak in a build log, or rotate. Less to get wrong on a
 * public demo.
 *
 * Token model: signing in returns a short-lived ID token (one hour) and a
 * long-lived refresh token. Both go into httpOnly cookies. When the ID token has
 * expired, the refresh token buys a new one — see refreshIdToken.
 */

const API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY!;
const IDENTITY = "https://identitytoolkit.googleapis.com/v1";
const SECURETOKEN = "https://securetoken.googleapis.com/v1";

export interface FirebaseUser {
  /** Firebase's uid. Mapped to User.authId in Postgres. */
  id: string;
  email: string;
  emailVerified: boolean;
}

export interface AuthTokens {
  idToken: string;
  refreshToken: string;
  /** Epoch milliseconds. */
  expiresAt: number;
}

/** Shape errors the same way across every call so callers can branch on `.code`. */
export class FirebaseAuthError extends Error {
  code: string;
  constructor(code: string, message?: string) {
    super(message ?? code);
    this.code = code;
    this.name = "FirebaseAuthError";
  }
}

async function call<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new FirebaseAuthError(
      json?.error?.message ?? "AUTH_FAILED",
      json?.error?.message,
    );
  }
  return json as T;
}

export async function signInWithPassword(
  email: string,
  password: string,
): Promise<AuthTokens & { user: FirebaseUser }> {
  const r = await call<{
    localId: string;
    email: string;
    idToken: string;
    refreshToken: string;
    expiresIn: string;
  }>(`${IDENTITY}/accounts:signInWithPassword?key=${API_KEY}`, {
    email,
    password,
    returnSecureToken: true,
  });

  return {
    idToken: r.idToken,
    refreshToken: r.refreshToken,
    expiresAt: Date.now() + Number(r.expiresIn) * 1000,
    user: { id: r.localId, email: r.email, emailVerified: true },
  };
}

/**
 * Resolve an ID token to a user.
 *
 * accounts:lookup is Google verifying its own token, which is why this needs no
 * signing key locally: a forged or expired token comes back as an error rather
 * than a user.
 */
export async function lookupUser(idToken: string): Promise<FirebaseUser | null> {
  try {
    const r = await call<{
      users: { localId: string; email: string; emailVerified?: boolean }[];
    }>(`${IDENTITY}/accounts:lookup?key=${API_KEY}`, { idToken });
    const u = r.users?.[0];
    if (!u) return null;
    return {
      id: u.localId,
      email: u.email,
      emailVerified: Boolean(u.emailVerified),
    };
  } catch {
    // An expired or invalid token is a normal signed-out state, not an outage.
    return null;
  }
}

export async function refreshIdToken(refreshToken: string): Promise<AuthTokens | null> {
  try {
    const res = await fetch(`${SECURETOKEN}/token?key=${API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }),
    });
    if (!res.ok) return null;
    const r = (await res.json()) as {
      id_token: string;
      refresh_token: string;
      expires_in: string;
    };
    return {
      idToken: r.id_token,
      refreshToken: r.refresh_token,
      expiresAt: Date.now() + Number(r.expires_in) * 1000,
    };
  } catch {
    return null;
  }
}

/**
 * Provision an account.
 *
 * accounts:signUp needs only the public API key, so admins can be created
 * without a service account. It returns tokens for the new user, which are
 * discarded here — creating an account must not sign the caller out of their
 * own session.
 *
 * Throws EMAIL_EXISTS when the address is taken, which callers should treat as
 * a recoverable conflict rather than a failure.
 */
export async function createAuthUser(
  email: string,
  password: string,
): Promise<{ id: string }> {
  const r = await call<{ localId: string }>(
    `${IDENTITY}/accounts:signUp?key=${API_KEY}`,
    { email, password, returnSecureToken: false },
  );
  return { id: r.localId };
}

export async function sendPasswordReset(email: string): Promise<void> {
  await call(`${IDENTITY}/accounts:sendOobCode?key=${API_KEY}`, {
    requestType: "PASSWORD_RESET",
    email,
  });
}

export async function updatePassword(
  idToken: string,
  password: string,
): Promise<void> {
  await call(`${IDENTITY}/accounts:update?key=${API_KEY}`, {
    idToken,
    password,
    returnSecureToken: false,
  });
}
