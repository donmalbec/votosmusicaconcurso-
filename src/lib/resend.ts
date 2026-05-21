import "server-only";

interface SendVoteConfirmationEmailInput {
  to: string;
  confirmUrl: string;
  videoTitle: string;
  artist: string;
}

function getFromEmail() {
  return (
    process.env.VOTE_EMAIL_FROM ||
    process.env.RESEND_FROM_EMAIL ||
    process.env.FROM_EMAIL ||
    "PizzaDAO x MusicaW3 <voto@canciondepizza.fun>"
  );
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export async function sendVoteConfirmationEmail({
  to,
  confirmUrl,
  videoTitle,
  artist,
}: SendVoteConfirmationEmailInput) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not configured.");
  }

  const safeTitle = escapeHtml(videoTitle);
  const safeArtist = escapeHtml(artist);

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      from: getFromEmail(),
      to,
      subject: `Confirma tu voto por ${videoTitle}`,
      html: `
        <div style="font-family:Arial,sans-serif;background:#0b0b0b;color:#fff;padding:28px;line-height:1.5">
          <div style="max-width:560px;margin:0 auto;border:1px solid rgba(255,230,0,.35);border-radius:16px;padding:28px;background:#111">
            <p style="color:#ffe600;font-weight:800;letter-spacing:.12em;text-transform:uppercase;margin:0 0 12px">PizzaDAO × MusicaW3</p>
            <h1 style="font-size:26px;margin:0 0 12px">Confirma tu voto</h1>
            <p style="color:#ddd;margin:0 0 20px">Estás votando por <strong>${safeTitle}</strong> de <strong>${safeArtist}</strong>.</p>
            <p style="color:#ddd;margin:0 0 24px">Toca el botón para confirmar tu correo y registrar el voto automáticamente.</p>
            <p style="margin:0 0 24px">
              <a href="${confirmUrl}" style="display:inline-block;background:#ffe600;color:#000;font-weight:900;text-decoration:none;border-radius:10px;padding:14px 22px;text-transform:uppercase;letter-spacing:.08em">Confirmar y votar</a>
            </p>
            <p style="font-size:12px;color:#aaa;margin:0 0 12px">Este enlace vence en 30 minutos y solo puede usarse una vez.</p>
            <p style="font-size:12px;color:#777;margin:0;word-break:break-all">Si el botón no funciona, copia este enlace:<br>${confirmUrl}</p>
          </div>
        </div>
      `,
      text: `Confirma tu voto por ${videoTitle} de ${artist}: ${confirmUrl}\n\nEl enlace vence en 30 minutos y solo puede usarse una vez.`,
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Resend failed (${response.status}): ${body}`);
  }
}
