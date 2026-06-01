import { NextResponse, type NextRequest } from "next/server";
import { VIDEOS } from "@/lib/data";
import { VOTING_PAUSED } from "@/lib/maintenance";
import { isValidEmail, normalizeEmail } from "@/lib/security";
import { getSupabaseAdminClient, getSupabaseAuthClient } from "@/lib/supabase";
import {
  createVerifiedEmailToken,
  getSecureCookieOptions,
  PENDING_MAGIC_VOTE_COOKIE,
  readPendingMagicVoteToken,
  VERIFIED_EMAIL_COOKIE,
  VERIFIED_EMAIL_DURATION_SECONDS,
} from "@/lib/vote-security";

export const dynamic = "force-dynamic";

type AllowedOtpType = "email" | "magiclink" | "signup";

const ALLOWED_OTP_TYPES = new Set<AllowedOtpType>(["email", "magiclink", "signup"]);

interface VoteIdentityStatus {
  email_exists: boolean;
  device_exists: boolean;
}

function getSafeRedirectUrl(
  request: NextRequest,
  status: "ok" | "error" | "success" | "duplicate" | "closed",
  videoId?: string
) {
  const redirectUrl = new URL("/", request.url);
  if (status === "success") {
    redirectUrl.searchParams.set("vote_success", "1");
  } else if (status === "duplicate") {
    redirectUrl.searchParams.set("vote_error", "duplicate");
  } else if (status === "closed") {
    redirectUrl.searchParams.set("vote_error", "closed");
  } else {
    redirectUrl.searchParams.set(status === "ok" ? "email_verified" : "vote_error", "1");
  }

  if (videoId) {
    redirectUrl.searchParams.set("video_id", videoId);
  }

  return redirectUrl;
}

function getRequestIp(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const candidates = [
    request.headers.get("cf-connecting-ip"),
    request.headers.get("x-real-ip"),
    request.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim(),
    forwardedFor,
  ];

  return candidates.find((candidate) => candidate && candidate.length <= 64) || "127.0.0.1";
}

async function readVoteIdentityStatus(email: string, deviceId: string) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase.rpc("get_vote_identity_status", {
    candidate_email: email,
    primary_device_id: deviceId,
    secondary_device_id: null,
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

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const requestedVideoId = requestUrl.searchParams.get("vote") || undefined;
  const rawType = requestUrl.searchParams.get("type") || "email";
  const type = ALLOWED_OTP_TYPES.has(rawType as AllowedOtpType)
    ? (rawType as AllowedOtpType)
    : "email";

  if (VOTING_PAUSED) {
    const response = NextResponse.redirect(getSafeRedirectUrl(request, "closed", requestedVideoId));
    response.cookies.delete(PENDING_MAGIC_VOTE_COOKIE);
    response.cookies.delete(VERIFIED_EMAIL_COOKIE);
    return response;
  }

  if (!tokenHash || tokenHash.length > 512) {
    return NextResponse.redirect(getSafeRedirectUrl(request, "error"));
  }

  const auth = getSupabaseAuthClient();
  const otpTypes = Array.from(new Set<AllowedOtpType>([type, "email", "signup"]));
  let verifiedEmail = "";

  for (const otpType of otpTypes) {
    const { data, error } = await auth.auth.verifyOtp({
      token_hash: tokenHash,
      type: otpType,
    });

    const email = normalizeEmail(data.user?.email || "");
    if (!error && isValidEmail(email)) {
      verifiedEmail = email;
      break;
    }
  }

  if (!verifiedEmail) {
    return NextResponse.redirect(getSafeRedirectUrl(request, "error"));
  }

  const pendingVote = readPendingMagicVoteToken(request.cookies.get(PENDING_MAGIC_VOTE_COOKIE)?.value);
  const pendingVideo = pendingVote
    ? VIDEOS.find((candidate) => candidate.id === pendingVote.videoId)
    : null;

  if (
    pendingVote &&
    pendingVideo &&
    pendingVote.email === verifiedEmail &&
    (!requestedVideoId || requestedVideoId === pendingVote.videoId)
  ) {
    try {
      const identityStatus = await readVoteIdentityStatus(verifiedEmail, pendingVote.deviceId);

      if (identityStatus.emailExists || identityStatus.deviceExists) {
        const response = NextResponse.redirect(getSafeRedirectUrl(request, "duplicate", pendingVideo.id));
        response.cookies.delete(PENDING_MAGIC_VOTE_COOKIE);
        return response;
      }

      const supabase = getSupabaseAdminClient();
      const { error } = await supabase.from("votes").insert({
        email: verifiedEmail,
        video_id: pendingVideo.id,
        video_title: pendingVideo.title,
        artist: pendingVideo.artist,
        ip_address: getRequestIp(request),
        device_id: pendingVote.deviceId,
      });

      if (!error) {
        const response = NextResponse.redirect(getSafeRedirectUrl(request, "success", pendingVideo.id));
        response.cookies.delete(PENDING_MAGIC_VOTE_COOKIE);
        response.cookies.delete(VERIFIED_EMAIL_COOKIE);
        return response;
      }

      if (error.code === "23505") {
        const response = NextResponse.redirect(getSafeRedirectUrl(request, "duplicate", pendingVideo.id));
        response.cookies.delete(PENDING_MAGIC_VOTE_COOKIE);
        return response;
      }

      console.error("[vote-auth] magic link vote insert failed", {
        code: error.code,
        message: error.message,
        videoId: pendingVideo.id,
      });
    } catch (error) {
      console.error("[vote-auth] magic link vote completion failed", error);
    }
  }

  const response = NextResponse.redirect(getSafeRedirectUrl(request, "ok", requestedVideoId));
  response.cookies.set(
    VERIFIED_EMAIL_COOKIE,
    createVerifiedEmailToken(verifiedEmail, "magic-link"),
    getSecureCookieOptions(VERIFIED_EMAIL_DURATION_SECONDS)
  );

  return response;
}
