import "server-only";

import { cookies } from "next/headers";
import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { isValidDeviceId, normalizeEmail } from "@/lib/security";

export const VERIFIED_EMAIL_COOKIE = "pizza_verified_vote_email";
export const VOTE_DEVICE_COOKIE = "pizza_vote_device";

export const VERIFIED_EMAIL_DURATION_SECONDS = 20 * 60;
export const VOTE_DEVICE_DURATION_SECONDS = 180 * 24 * 60 * 60;

type VerifiedEmailMethod = "code" | "magic-link";

interface VoteDeviceProof {
  deviceId: string;
  fingerprintHash: string;
  isNew: boolean;
}

export function hash(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function safeEqual(a: string, b: string) {
  const aHash = Buffer.from(hash(a), "hex");
  const bHash = Buffer.from(hash(b), "hex");
  return timingSafeEqual(aHash, bHash);
}

function getVoteSecuritySecret() {
  const secret =
    process.env.VOTE_SECURITY_SECRET ||
    process.env.ADMIN_SESSION_SECRET ||
    process.env.ADMIN_PASSWORD;

  if (!secret || secret.length < 12) {
    throw new Error("Vote security secret is not configured.");
  }

  return secret;
}

function sign(payload: string) {
  return createHmac("sha256", getVoteSecuritySecret()).update(payload).digest("hex");
}

function deviceIdForFingerprint(fingerprint: string) {
  return createHmac("sha256", getVoteSecuritySecret())
    .update(`vote-device:${fingerprint}`)
    .digest("hex");
}

export function getSecureCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

export function createVerifiedEmailToken(email: string, method: VerifiedEmailMethod = "code") {
  const expiresAt = Date.now() + VERIFIED_EMAIL_DURATION_SECONDS * 1000;
  const nonce = randomBytes(16).toString("hex");
  const normalizedEmail = normalizeEmail(email);
  const encodedEmail = Buffer.from(normalizedEmail).toString("base64url");
  const payload = `v1.${expiresAt}.${nonce}.${encodedEmail}.${method}`;

  return `${payload}.${sign(payload)}`;
}

export function readVerifiedEmailToken(token?: string) {
  if (!token) return null;

  const parts = token.split(".");
  if (parts.length !== 6 || parts[0] !== "v1") return null;

  const [version, expiresAtRaw, nonce, encodedEmail, method, signature] = parts;
  const expiresAt = Number(expiresAtRaw);
  if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) return null;
  if (method !== "code" && method !== "magic-link") return null;

  const payload = `${version}.${expiresAtRaw}.${nonce}.${encodedEmail}.${method}`;
  const expected = sign(payload);
  if (!safeEqual(signature, expected)) return null;

  return normalizeEmail(Buffer.from(encodedEmail, "base64url").toString("utf8"));
}

export async function getVerifiedEmail() {
  const cookieStore = await cookies();
  return readVerifiedEmailToken(cookieStore.get(VERIFIED_EMAIL_COOKIE)?.value);
}

export async function setVerifiedEmailCookie(email: string, method: VerifiedEmailMethod = "code") {
  const cookieStore = await cookies();
  cookieStore.set(
    VERIFIED_EMAIL_COOKIE,
    createVerifiedEmailToken(email, method),
    getSecureCookieOptions(VERIFIED_EMAIL_DURATION_SECONDS)
  );
}

export async function clearVerifiedEmailCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(VERIFIED_EMAIL_COOKIE);
}

function createVoteDeviceToken(fingerprint: string) {
  const expiresAt = Date.now() + VOTE_DEVICE_DURATION_SECONDS * 1000;
  const nonce = randomBytes(24).toString("hex");
  const fingerprintHash = hash(fingerprint);
  const payload = `v1.${expiresAt}.${nonce}.${fingerprintHash}`;

  return `${payload}.${sign(payload)}`;
}

function readVoteDeviceToken(token: string | undefined, fingerprint: string) {
  if (!token || !isValidDeviceId(fingerprint)) return null;

  const parts = token.split(".");
  if (parts.length !== 5 || parts[0] !== "v1") return null;

  const [version, expiresAtRaw, nonce, fingerprintHash, signature] = parts;
  const expiresAt = Number(expiresAtRaw);
  if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) return null;

  const expectedFingerprintHash = hash(fingerprint);
  if (!safeEqual(fingerprintHash, expectedFingerprintHash)) return null;

  const payload = `${version}.${expiresAtRaw}.${nonce}.${fingerprintHash}`;
  const expected = sign(payload);
  if (!safeEqual(signature, expected)) return null;

  return {
    deviceId: deviceIdForFingerprint(fingerprint),
    fingerprintHash,
  };
}

export async function ensureVoteDevice(fingerprint: string): Promise<VoteDeviceProof> {
  if (!isValidDeviceId(fingerprint)) {
    throw new Error("Invalid browser fingerprint.");
  }

  const cookieStore = await cookies();
  const existing = readVoteDeviceToken(cookieStore.get(VOTE_DEVICE_COOKIE)?.value, fingerprint);
  if (existing) {
    return { ...existing, isNew: false };
  }

  cookieStore.set(
    VOTE_DEVICE_COOKIE,
    createVoteDeviceToken(fingerprint),
    getSecureCookieOptions(VOTE_DEVICE_DURATION_SECONDS)
  );

  return {
    deviceId: deviceIdForFingerprint(fingerprint),
    fingerprintHash: hash(fingerprint),
    isNew: true,
  };
}

export async function getVerifiedVoteDevice(fingerprint: string) {
  if (!isValidDeviceId(fingerprint)) return null;

  const cookieStore = await cookies();
  return readVoteDeviceToken(cookieStore.get(VOTE_DEVICE_COOKIE)?.value, fingerprint);
}
