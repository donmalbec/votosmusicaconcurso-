import { NextResponse, type NextRequest } from "next/server";

const PRIMARY_HOST = "canciondepizza.fun";
const WWW_HOST = `www.${PRIMARY_HOST}`;

export function proxy(request: NextRequest) {
  if (request.nextUrl.hostname !== WWW_HOST) {
    return NextResponse.next();
  }

  const canonicalUrl = request.nextUrl.clone();
  canonicalUrl.hostname = PRIMARY_HOST;
  return NextResponse.redirect(canonicalUrl, 308);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
