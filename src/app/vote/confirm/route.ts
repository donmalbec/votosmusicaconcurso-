import { NextRequest } from "next/server";
import { confirmVoteFromEmailToken } from "@/app/actions";

export const dynamic = "force-dynamic";

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

function page({ title, heading, message, tone }: { title: string; heading: string; message: string; tone: "success" | "warning" | "error" }) {
  const color = tone === "success" ? "#ffe600" : tone === "warning" ? "#ffb84d" : "#ff7a7a";
  return new Response(`<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <style>
    body{margin:0;min-height:100vh;background:#050505;color:#fff;font-family:Arial,sans-serif;display:grid;place-items:center;padding:24px}
    main{max-width:620px;border:1px solid rgba(255,230,0,.32);border-radius:20px;background:#111;padding:32px;text-align:center;box-shadow:0 0 80px rgba(255,230,0,.10)}
    .badge{color:${color};font-weight:900;letter-spacing:.18em;text-transform:uppercase;font-size:12px;margin-bottom:12px}
    h1{font-size:34px;line-height:1;margin:0 0 16px;text-transform:uppercase}
    p{color:#d6d6d6;line-height:1.6;margin:0 0 24px}
    a{display:inline-block;background:#ffe600;color:#000;text-decoration:none;border-radius:12px;padding:14px 22px;font-weight:900;text-transform:uppercase;letter-spacing:.08em}
  </style>
</head>
<body>
  <main>
    <div class="badge">PizzaDAO × MusicaW3</div>
    <h1>${heading}</h1>
    <p>${message}</p>
    <a href="/">Volver al sitio</a>
  </main>
</body>
</html>`, {
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" },
  });
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token") || "";
  const result = await confirmVoteFromEmailToken(token, getRequestIp(request));

  if (result.success) {
    return page({
      title: "Voto registrado",
      heading: "Tu voto fue registrado",
      message: `Confirmamos tu correo y tu voto por “${result.videoTitle}” quedó registrado correctamente en el sitio. ¡Gracias por votar!`,
      tone: "success",
    });
  }

  return page({
    title: result.alreadyCounted ? "Voto ya registrado" : "No pudimos registrar el voto",
    heading: result.alreadyCounted ? "Voto ya registrado" : "Enlace no válido",
    message: result.error,
    tone: result.alreadyCounted ? "warning" : "error",
  });
}
