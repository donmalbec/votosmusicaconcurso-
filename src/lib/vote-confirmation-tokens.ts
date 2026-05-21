import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { isValidDeviceId, isValidEmail, normalizeEmail } from "@/lib/security";

export const VOTE_CONFIRMATION_DURATION_SECONDS = 30 * 60;

export interface VoteConfirmationPayload {
  email: string;
  videoId: string;
  deviceId: string;
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

function hashValue(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function safeEqual(a: string, b: string) {
  const aHash = Buffer.from(hashValue(a), "hex");
  const bHash = Buffer.from(hashValue(b), "hex");
  return timingSafeEqual(aHash, bHash);
}

function sign(payload: string) {
  return createHmac("sha256", getVoteSecuritySecret()).update(payload).digest("hex");
}

export function hashVoteConfirmationToken(token: string) {
  return hashValue(token);
}

export function createVoteConfirmationToken({ email, videoId, deviceId }: VoteConfirmationPayload) {
  const normalizedEmail = normalizeEmail(email);
  if (!isValidEmail(normalizedEmail)) {
    throw new Error("Invalid vote confirmation email.");
  }
  if (!videoId || videoId.length > 128) {
    throw new Error("Invalid vote confirmation video id.");
  }
  if (!isValidDeviceId(deviceId)) {
    throw new Error("Invalid vote confirmation device id.");
  }

  const expiresAt = Date.now() + VOTE_CONFIRMATION_DURATION_SECONDS * 1000;
  const nonce = randomBytes(24).toString("hex");
  const encodedEmail = Buffer.from(normalizedEmail).toString("base64url");
  const encodedVideoId = Buffer.from(videoId).toString("base64url");
  const payload = `v1.${expiresAt}.${nonce}.${encodedEmail}.${encodedVideoId}.${deviceId}`;

  return `${payload}.${sign(payload)}`;
}

export function readVoteConfirmationToken(token?: string | null): VoteConfirmationPayload | null {
  if (!token) return null;

  const parts = token.split(".");
  if (parts.length !== 7 || parts[0] !== "v1") return null;

  const [version, expiresAtRaw, nonce, encodedEmail, encodedVideoId, deviceId, signature] = parts;
  const expiresAt = Number(expiresAtRaw);
  if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) return null;

  const payload = `${version}.${expiresAtRaw}.${nonce}.${encodedEmail}.${encodedVideoId}.${deviceId}`;
  const expected = sign(payload);
  if (!safeEqual(signature, expected)) return null;

  const email = normalizeEmail(Buffer.from(encodedEmail, "base64url").toString("utf8"));
  const videoId = Buffer.from(encodedVideoId, "base64url").toString("utf8");
  if (!isValidEmail(email) || !isValidDeviceId(deviceId) || !videoId || videoId.length > 128) {
    return null;
  }

  return { email, videoId, deviceId };
}
