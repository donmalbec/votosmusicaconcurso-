"use server";

import "server-only";

import { cookies, headers } from "next/headers";
import { createHmac, randomBytes } from "node:crypto";
import { VIDEOS, type VoteRecord } from "@/lib/data";
import {
  isDisposableEmail,
  isValidDeviceId,
  isValidEmail,
  normalizeEmail,
} from "@/lib/security";
import { VOTING_PAUSED, VOTING_PAUSED_ERROR } from "@/lib/maintenance";
import { getSupabaseAdminClient, getSupabaseAuthClient } from "@/lib/supabase";
import {
  clearVerifiedEmailCookie,
  clearPendingMagicVoteCookie,
  ensureVoteDevice,
  getVerifiedEmail,
  getVerifiedVoteDevice,
  hash,
  safeEqual,
  setPendingMagicVoteCookie,
  setVerifiedEmailCookie,
} from "@/lib/vote-security";

type VoteCounts = Record<string, number>;

type ActionResult<T> =
  | ({ success: true } & T)
  | { success: false; error: string };

type EmptyActionResult = { success: true } | { success: false; error: string };
type VerificationActionResult =
  | { success: true; alreadyVerified?: boolean }
  | { success: false; error: string };

interface CastVoteInput {
  email: string;
  videoId: string;
  deviceFingerprint: string;
  website?: string;
}

interface VerificationInput {
  email: string;
  videoId: string;
  deviceFingerprint: string;
  captchaToken?: string;
  website?: string;
}

interface VoteRow {
  id: string;
  email: string;
  video_id: string;
  video_title: string;
  artist: string;
  ip_address: string | null;
  created_at: string;
  device_id: string | null;
}

interface VoteIdentityStatus {
  email_exists: boolean;
  device_exists: boolean;
}

const ADMIN_SESSION_COOKIE = "pizza_admin_session";
const ADMIN_SESSION_DURATION_SECONDS = 6 * 60 * 60;
const RATE_LIMIT_WINDOW_MS = Number(process.env.VOTE_RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000);
const RATE_LIMIT_MAX = Number(process.env.VOTE_RATE_LIMIT_MAX || 20);
const EMAIL_CODE_RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const EMAIL_CODE_RATE_LIMIT_MAX = 3;
const memoryRateLimit = new Map<string, number[]>();

function getAdminPassword() {
  const password = process.env.ADMIN_PASSWORD;
  return password && password.length >= 12 ? password : null;
}

function getAdminSessionSecret() {
  return process.env.ADMIN_SESSION_SECRET || getAdminPassword();
}

function signAdminSession(payload: string) {
  const secret = getAdminSessionSecret();
  if (!secret) {
    throw new Error("Admin session secret is not configured.");
  }

  return createHmac("sha256", secret).update(payload).digest("hex");
}

function createAdminSessionToken() {
  const expiresAt = Date.now() + ADMIN_SESSION_DURATION_SECONDS * 1000;
  const nonce = randomBytes(16).toString("hex");
  const payload = `v1.${expiresAt}.${nonce}`;
  return `${payload}.${signAdminSession(payload)}`;
}

function verifyAdminSessionToken(token?: string) {
  if (!token) return false;

  const parts = token.split(".");
  if (parts.length !== 4 || parts[0] !== "v1") return false;

  const [version, expiresAtRaw, nonce, signature] = parts;
  const expiresAt = Number(expiresAtRaw);
  if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) return false;

  const payload = `${version}.${expiresAtRaw}.${nonce}`;
  const expected = signAdminSession(payload);
  return safeEqual(signature, expected);
}

async function hasAdminSession() {
  const cookieStore = await cookies();
  return verifyAdminSessionToken(cookieStore.get(ADMIN_SESSION_COOKIE)?.value);
}

function getRequestIp(headerList: Awaited<ReturnType<typeof headers>>) {
  const forwardedFor = headerList.get("x-forwarded-for")?.split(",")[0]?.trim();
  const candidates = [
    headerList.get("cf-connecting-ip"),
    headerList.get("x-real-ip"),
    headerList.get("x-vercel-forwarded-for")?.split(",")[0]?.trim(),
    forwardedFor,
  ];

  const ip = candidates.find((candidate) => candidate && candidate.length <= 64);
  return ip || "127.0.0.1";
}

function getRequestOrigin(headerList: Awaited<ReturnType<typeof headers>>) {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL;
  if (configuredUrl) return configuredUrl.replace(/\/$/, "");

  const host = headerList.get("x-forwarded-host") || headerList.get("host");
  const proto = headerList.get("x-forwarded-proto") || "https";

  if (!host) return "http://localhost:3000";
  return `${proto}://${host}`;
}

function getErrorText(error: unknown, key: "message" | "code" | "status") {
  if (!error || typeof error !== "object" || !(key in error)) return "";

  const value = (error as Record<string, unknown>)[key];
  return typeof value === "string" || typeof value === "number" ? String(value) : "";
}

function getVerificationEmailError(error: unknown) {
  const message = getErrorText(error, "message");
  const code = getErrorText(error, "code");
  const normalized = `${message} ${code}`.toLowerCase();

  if (normalized.includes("rate limit") || normalized.includes("over_email_send_rate_limit")) {
    return "Supabase limitó el envío de correos por unos minutos. Espera un momento y vuelve a intentarlo.";
  }

  if (
    normalized.includes("redirect") ||
    normalized.includes("redirect_to") ||
    normalized.includes("url not allowed") ||
    normalized.includes("uri")
  ) {
    return "Falta autorizar este dominio en Supabase Auth. Revisa Site URL y Redirect URLs.";
  }

  if (normalized.includes("supabase auth credentials") || normalized.includes("supabaseurl is required")) {
    return "La verificación por correo no está configurada en el servidor.";
  }

  return "No pudimos enviar el enlace. Intenta nuevamente.";
}

function logVerificationEmailError(error: unknown) {
  console.error("[vote-auth] magic link send failed", {
    message: getErrorText(error, "message") || String(error),
    code: getErrorText(error, "code") || undefined,
    status: getErrorText(error, "status") || undefined,
  });
}

function checkMemoryRateLimit(
  key: string,
  windowMs = RATE_LIMIT_WINDOW_MS,
  maxAttempts = RATE_LIMIT_MAX
) {
  const now = Date.now();
  const recent = (memoryRateLimit.get(key) || []).filter((timestamp) => now - timestamp < windowMs);

  if (recent.length >= maxAttempts) {
    memoryRateLimit.set(key, recent);
    return false;
  }

  memoryRateLimit.set(key, [...recent, now]);
  return true;
}

async function isIpOverDatabaseLimit(ip: string) {
  const supabase = getSupabaseAdminClient();
  const since = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();
  const { count, error } = await supabase
    .from("votes")
    .select("id", { count: "exact", head: true })
    .eq("ip_address", ip)
    .gte("created_at", since);

  if (error) {
    throw error;
  }

  return (count || 0) >= RATE_LIMIT_MAX;
}

function isCaptchaRequired() {
  return process.env.REQUIRE_HCAPTCHA === "true" || Boolean(process.env.HCAPTCHA_SECRET);
}

async function verifyCaptchaToken(token: string | undefined, ip: string) {
  const secret = process.env.HCAPTCHA_SECRET;
  if (!isCaptchaRequired()) return true;
  if (!secret) return false;
  if (!token) return false;

  const response = await fetch("https://hcaptcha.com/siteverify", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      secret,
      response: token,
      remoteip: ip,
    }),
    cache: "no-store",
  });

  if (!response.ok) return false;

  const payload = (await response.json()) as { success?: boolean };
  return payload.success === true;
}

async function readVoteIdentityStatus(
  email: string,
  deviceId: string,
  browserFingerprint: string
) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase.rpc("get_vote_identity_status", {
    candidate_email: email,
    primary_device_id: deviceId,
    secondary_device_id: browserFingerprint,
  });

  if (error) {
    throw error;
  }

  const status = (Array.isArray(data) ? data[0] : data) as VoteIdentityStatus | null;
  return {
    emailExists: status?.email_exists === true,
    deviceExists: status?.device_exists === true,
  };
}

function mapVoteRecord(row: VoteRow): VoteRecord {
  return {
    id: row.id,
    email: row.email,
    videoId: row.video_id,
    videoTitle: row.video_title,
    artist: row.artist,
    ip: row.ip_address || "",
    timestamp: row.created_at,
    deviceId: row.device_id || "",
  };
}

async function readVoteCounts(): Promise<VoteCounts> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase.from("votes").select("video_id");

  if (error) {
    throw error;
  }

  return (data || []).reduce<VoteCounts>((counts, row) => {
    const videoId = String(row.video_id);
    counts[videoId] = (counts[videoId] || 0) + 1;
    return counts;
  }, {});
}

async function readAdminVoteRecords() {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("votes")
    .select("id,email,video_id,video_title,artist,ip_address,created_at,device_id")
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return ((data || []) as VoteRow[]).map(mapVoteRecord);
}

export async function fetchPublicVoteCounts(): Promise<ActionResult<{ counts: VoteCounts }>> {
  try {
    return { success: true, counts: await readVoteCounts() };
  } catch {
    return { success: false, error: "No se pudieron cargar los votos." };
  }
}

export async function sendVoteVerificationCode(input: VerificationInput): Promise<VerificationActionResult> {
  try {
    if (VOTING_PAUSED) {
      return { success: false, error: VOTING_PAUSED_ERROR };
    }

    if (input.website) {
      return { success: false, error: "No pudimos validar el correo." };
    }

    const headerList = await headers();
    const ip = getRequestIp(headerList);
    const origin = getRequestOrigin(headerList);
    const email = normalizeEmail(input.email);
    const video = VIDEOS.find((candidate) => candidate.id === input.videoId);

    if (!video) {
      return { success: false, error: "La canción seleccionada no es válida." };
    }

    if (!isValidEmail(email)) {
      return { success: false, error: "Por favor ingresa un correo electrónico válido." };
    }

    if (isDisposableEmail(email)) {
      return { success: false, error: "No se permiten correos temporales o desechables." };
    }

    if (!isValidDeviceId(input.deviceFingerprint)) {
      return { success: false, error: "No pudimos validar este dispositivo." };
    }

    const voteDevice = await ensureVoteDevice(input.deviceFingerprint);

    if (
      !checkMemoryRateLimit(`email-code:ip:${ip}`, EMAIL_CODE_RATE_LIMIT_WINDOW_MS, EMAIL_CODE_RATE_LIMIT_MAX) ||
      !checkMemoryRateLimit(`email-code:email:${hash(email)}`, EMAIL_CODE_RATE_LIMIT_WINDOW_MS, EMAIL_CODE_RATE_LIMIT_MAX)
    ) {
      return { success: false, error: "Demasiados enlaces solicitados. Espera unos minutos." };
    }

    if (!(await verifyCaptchaToken(input.captchaToken, ip))) {
      return { success: false, error: "Completa la verificación anti-bot para continuar." };
    }

    const identityStatus = await readVoteIdentityStatus(email, voteDevice.deviceId, input.deviceFingerprint);

    if (identityStatus.emailExists) {
      return { success: false, error: "Este correo ya registró un voto en el concurso." };
    }

    if (identityStatus.deviceExists) {
      return { success: false, error: "Este dispositivo ya registró un voto en el concurso." };
    }

    if ((await getVerifiedEmail()) === email) {
      return { success: true, alreadyVerified: true };
    }

    await setPendingMagicVoteCookie(email, video.id, voteDevice.deviceId);

    const auth = getSupabaseAuthClient();
    const { error } = await auth.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: `${origin}/auth/confirm?vote=${encodeURIComponent(video.id)}`,
      },
    });

    if (error) {
      await clearPendingMagicVoteCookie();
      logVerificationEmailError(error);
      return { success: false, error: getVerificationEmailError(error) };
    }

    return { success: true };
  } catch (error) {
    logVerificationEmailError(error);
    return { success: false, error: getVerificationEmailError(error) };
  }
}

export async function verifyVoteEmailCode(emailInput: string, tokenInput: string): Promise<EmptyActionResult> {
  try {
    if (VOTING_PAUSED) {
      return { success: false, error: VOTING_PAUSED_ERROR };
    }

    const email = normalizeEmail(emailInput);
    const token = tokenInput.trim().replace(/\s+/g, "");

    if (!isValidEmail(email)) {
      return { success: false, error: "Correo inválido." };
    }

    if (!/^[0-9]{6,8}$/.test(token)) {
      return { success: false, error: "Código inválido." };
    }

    const auth = getSupabaseAuthClient();
    const { error } = await auth.auth.verifyOtp({
      email,
      token,
      type: "email",
    });

    if (error) {
      return { success: false, error: "Código incorrecto o expirado." };
    }

    await setVerifiedEmailCookie(email, "code");

    return { success: true };
  } catch {
    return { success: false, error: "No pudimos verificar el código." };
  }
}

export async function castVote(input: CastVoteInput): Promise<ActionResult<{ counts: VoteCounts; email: string; videoId: string }>> {
  try {
    if (VOTING_PAUSED) {
      return { success: false, error: VOTING_PAUSED_ERROR };
    }

    if (input.website) {
      return { success: false, error: "No pudimos validar el voto." };
    }

    const headerList = await headers();
    const ip = getRequestIp(headerList);
    const email = normalizeEmail(input.email);
    const video = VIDEOS.find((candidate) => candidate.id === input.videoId);

    if (!video) {
      return { success: false, error: "La canción seleccionada no es válida." };
    }

    if (!isValidEmail(email)) {
      return { success: false, error: "Por favor ingresa un correo electrónico válido." };
    }

    if (isDisposableEmail(email)) {
      return { success: false, error: "No se permiten correos temporales o desechables." };
    }

    const verifiedEmail = await getVerifiedEmail();
    if (!verifiedEmail || verifiedEmail !== email) {
      return { success: false, error: "Verifica tu correo antes de votar." };
    }

    if (!isValidDeviceId(input.deviceFingerprint)) {
      return { success: false, error: "No pudimos validar este dispositivo." };
    }

    const voteDevice = await getVerifiedVoteDevice(input.deviceFingerprint);
    if (!voteDevice) {
      return { success: false, error: "Inicia nuevamente la verificación de tu dispositivo." };
    }

    if (!checkMemoryRateLimit(`vote:${ip}`) || (await isIpOverDatabaseLimit(ip))) {
      return { success: false, error: "Demasiados intentos. Por seguridad, espera unos minutos." };
    }

    const supabase = getSupabaseAdminClient();
    const identityStatus = await readVoteIdentityStatus(email, voteDevice.deviceId, input.deviceFingerprint);

    if (identityStatus.emailExists) {
      return { success: false, error: "Este correo ya registró un voto en el concurso." };
    }

    if (identityStatus.deviceExists) {
      return { success: false, error: "Este dispositivo ya registró un voto en el concurso." };
    }

    const { error } = await supabase.from("votes").insert({
      email,
      video_id: video.id,
      video_title: video.title,
      artist: video.artist,
      ip_address: ip,
      device_id: voteDevice.deviceId,
    });

    if (error) {
      if (error.code === "23505") {
        return { success: false, error: "Voto duplicado detectado." };
      }

      console.error("[vote] insert failed", {
        code: error.code,
        message: error.message,
        videoId: video.id,
      });
      throw error;
    }

    await clearVerifiedEmailCookie();
    await clearPendingMagicVoteCookie();

    return {
      success: true,
      counts: await readVoteCounts(),
      email,
      videoId: video.id,
    };
  } catch {
    return { success: false, error: "Error de conexión con la base de datos." };
  }
}

/**
 * Verifica la contraseña del administrador en el servidor y crea una sesión httpOnly.
 */
export async function verifyAdminPassword(password: string): Promise<EmptyActionResult> {
  const correctPassword = getAdminPassword();

  if (!correctPassword) {
    return { success: false, error: "ADMIN_PASSWORD debe configurarse en el entorno del servidor." };
  }

  if (!safeEqual(password, correctPassword)) {
    return { success: false, error: "Contraseña incorrecta. Acceso denegado." };
  }

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE, createAdminSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ADMIN_SESSION_DURATION_SECONDS,
  });

  return { success: true };
}

export async function logoutAdmin() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_SESSION_COOKIE);
  return { success: true };
}

export async function fetchAdminVoteRecords(): Promise<ActionResult<{ records: VoteRecord[]; counts: VoteCounts }>> {
  try {
    if (!(await hasAdminSession())) {
      return { success: false, error: "Sesión de administrador expirada." };
    }

    const [records, counts] = await Promise.all([readAdminVoteRecords(), readVoteCounts()]);
    return { success: true, records, counts };
  } catch {
    return { success: false, error: "No se pudo cargar la auditoría de votos." };
  }
}

export async function deleteVoteRecord(id: string): Promise<ActionResult<{ counts: VoteCounts }>> {
  try {
    if (!(await hasAdminSession())) {
      return { success: false, error: "Sesión de administrador expirada." };
    }

    if (!id || id.length > 128) {
      return { success: false, error: "Registro inválido." };
    }

    const supabase = getSupabaseAdminClient();
    const { error } = await supabase.from("votes").delete().eq("id", id);

    if (error) {
      throw error;
    }

    return { success: true, counts: await readVoteCounts() };
  } catch {
    return { success: false, error: "No se pudo eliminar el voto." };
  }
}
