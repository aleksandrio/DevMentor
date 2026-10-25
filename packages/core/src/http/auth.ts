import { jwtVerify, SignJWT } from "jose";
import { USER_ROLES, type UserRole } from "@devmentor/db";
import { ForbiddenError, UnauthorizedError } from "./errors";

export interface Session {
  userId: string;
  role: UserRole;
}

export const SESSION_COOKIE = "devmentor_session";
// 24 h; there is no refresh-token flow in the MVP, so the user logs in again
// after expiry. Do not lengthen this to compensate.
export const SESSION_TTL_SECONDS = 24 * 60 * 60;
const JWT_ALGORITHM = "HS256";

/** Thrown when auth is used without AUTH_SECRET; apiHandler turns it into a logged 500. */
export class AuthNotConfiguredError extends Error {
  constructor() {
    super("AUTH_SECRET is not set; authentication is unavailable.");
    this.name = "AuthNotConfiguredError";
  }
}

function requireSecret(secret: Uint8Array | null): Uint8Array {
  if (!secret) {
    throw new AuthNotConfiguredError();
  }
  return secret;
}

export async function createSessionToken(session: Session, secret: Uint8Array | null): Promise<string> {
  return new SignJWT({ role: session.role })
    .setProtectedHeader({ alg: JWT_ALGORITHM })
    .setSubject(session.userId)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(requireSecret(secret));
}

function readCookie(request: Request, name: string): string | null {
  const header = request.headers.get("cookie");
  if (!header) {
    return null;
  }
  for (const part of header.split(";")) {
    const separator = part.indexOf("=");
    if (separator !== -1 && part.slice(0, separator).trim() === name) {
      return decodeURIComponent(part.slice(separator + 1).trim());
    }
  }
  return null;
}

function isUserRole(value: unknown): value is UserRole {
  return USER_ROLES.includes(value as UserRole);
}

/** The verified session from the request cookie (see verifySessionToken). */
export async function readSession(request: Request, secret: Uint8Array | null): Promise<Session | null> {
  return verifySessionToken(readCookie(request, SESSION_COOKIE), secret);
}

/** The verified session, or `null` for a missing, expired, tampered or malformed token. */
export async function verifySessionToken(
  token: string | null | undefined,
  secret: Uint8Array | null,
): Promise<Session | null> {
  if (!token) {
    return null;
  }
  const key = requireSecret(secret);
  try {
    const { payload } = await jwtVerify(token, key, { algorithms: [JWT_ALGORITHM] });
    if (typeof payload.sub !== "string" || !isUserRole(payload.role)) {
      return null;
    }
    return { userId: payload.sub, role: payload.role };
  } catch {
    // Fail closed: any verification problem means "no session", never "allow".
    return null;
  }
}

export async function requireSession(request: Request, secret: Uint8Array | null): Promise<Session> {
  const session = await readSession(request, secret);
  if (!session) {
    throw new UnauthorizedError();
  }
  return session;
}

export function requireRole(session: Session, role: UserRole): void {
  if (session.role !== role) {
    throw new ForbiddenError();
  }
}

/** Ownership check for mutations: a user may change only their own records. */
export function assertOwns(session: Session, ownerId: string): void {
  if (session.userId !== ownerId) {
    throw new ForbiddenError();
  }
}

interface CookieOptions {
  /** `true` in production; browsers drop Secure cookies on plain-HTTP localhost. */
  secure: boolean;
}

function serializeSessionCookie(value: string, maxAgeSeconds: number, { secure }: CookieOptions): string {
  const attributes = [
    `${SESSION_COOKIE}=${encodeURIComponent(value)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${maxAgeSeconds}`,
  ];
  if (secure) {
    attributes.push("Secure");
  }
  return attributes.join("; ");
}

export function sessionCookie(token: string, options: CookieOptions): string {
  return serializeSessionCookie(token, SESSION_TTL_SECONDS, options);
}

export function clearedSessionCookie(options: CookieOptions): string {
  return serializeSessionCookie("", 0, options);
}
