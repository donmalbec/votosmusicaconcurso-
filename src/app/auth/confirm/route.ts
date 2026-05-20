import { NextResponse, type NextRequest } from "next/server";
import { isValidEmail, normalizeEmail } from "@/lib/security";
import { getSupabaseAuthClient } from "@/lib/supabase";
import {
  createVerifiedEmailToken,
  getSecureCookieOptions,
  VERIFIED_EMAIL_COOKIE,
  VERIFIED_EMAIL_DURATION_SECONDS,
} from "@/lib/vote-security";

export const dynamic = "force-dynamic";

const ALLOWED_OTP_TYPES = new Set(["email", "magiclink", "signup"]);

function getSafeRedirectUrl(request: NextRequest, status: "ok" | "error") {
  const redirectUrl = new URL("/", request.url);
  redirectUrl.searchParams.set(status === "ok" ? "email_verified" : "vote_error", "1");
  return redirectUrl;
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const rawType = requestUrl.searchParams.get("type") || "email";
  const type = ALLOWED_OTP_TYPES.has(rawType) ? rawType : "email";

  if (!tokenHash || tokenHash.length > 512) {
    return NextResponse.redirect(getSafeRedirectUrl(request, "error"));
  }

  const auth = getSupabaseAuthClient();
  const { data, error } = await auth.auth.verifyOtp({
    token_hash: tokenHash,
    type: type as "email" | "magiclink" | "signup",
  });

  const email = normalizeEmail(data.user?.email || "");
  if (error || !isValidEmail(email)) {
    return NextResponse.redirect(getSafeRedirectUrl(request, "error"));
  }

  const response = NextResponse.redirect(getSafeRedirectUrl(request, "ok"));
  response.cookies.set(
    VERIFIED_EMAIL_COOKIE,
    createVerifiedEmailToken(email, "magic-link"),
    getSecureCookieOptions(VERIFIED_EMAIL_DURATION_SECONDS)
  );

  return response;
}
