"use client";

import { useState, useEffect, useRef, useId } from "react";
import Image from "next/image";
import { X, ShieldCheck, CheckCircle2, MailCheck, Loader2 } from "lucide-react";
import HCaptcha from "@hcaptcha/react-hcaptcha";
import { Video } from "@/lib/data";
import {
  VOTING_PAUSED_MESSAGE,
  VOTING_PAUSED_TITLE,
} from "@/lib/maintenance";
import { getBrowserFingerprint, isDisposableEmail, normalizeEmail } from "@/lib/security";
import { sendVoteVerificationCode } from "@/app/actions";

interface VoteModalProps {
  video: Video | null;
  onClose: () => void;
  onSuccess: (email: string) => void;
  votingPaused?: boolean;
}

const HCAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY;
const PENDING_MAGIC_VOTE_KEY = "pizza_pending_magic_vote";
const PENDING_MAGIC_VOTE_MAX_AGE_MS = 20 * 60 * 1000;

interface PendingMagicVote {
  email: string;
  videoId: string;
  createdAt: number;
}

function getPendingMagicVote(videoId?: string) {
  if (typeof window === "undefined" || !videoId) return null;

  try {
    const pending = JSON.parse(
      window.localStorage.getItem(PENDING_MAGIC_VOTE_KEY) || "null"
    ) as PendingMagicVote | null;

    if (
      !pending ||
      pending.videoId !== videoId ||
      Date.now() - pending.createdAt > PENDING_MAGIC_VOTE_MAX_AGE_MS
    ) {
      return null;
    }

    return pending;
  } catch {
    return null;
  }
}

function savePendingMagicVote(email: string, videoId: string) {
  try {
    window.localStorage.setItem(
      PENDING_MAGIC_VOTE_KEY,
      JSON.stringify({
        email: normalizeEmail(email),
        videoId,
        createdAt: Date.now(),
      })
    );
  } catch {}
}

function clearPendingMagicVote() {
  try {
    window.localStorage.removeItem(PENDING_MAGIC_VOTE_KEY);
  } catch {}
}

export function VoteModal({
  video,
  onClose,
  votingPaused = false,
}: VoteModalProps) {
  const modalTitleId = useId();
  const modalDescriptionId = useId();
  const emailInputId = useId();
  const errorId = useId();
  const [email, setEmail] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const [website, setWebsite] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"email" | "code" | "success">("email");
  const captchaRef = useRef<HCaptcha>(null);

  useEffect(() => {
    let cancelled = false;

    queueMicrotask(() => {
      if (cancelled) return;
      const pendingVote = getPendingMagicVote(video?.id);
      setStep(pendingVote ? "code" : "email");
      setEmail(pendingVote?.email || "");
      setCaptchaToken("");
      setWebsite("");
      setError("");
      captchaRef.current?.resetCaptcha();
    });

    return () => {
      cancelled = true;
    };
  }, [video?.id]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !loading) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [loading, onClose]);

  if (!video) return null;

  if (votingPaused) {
    return (
      <div
        className="fixed inset-0 modal-backdrop z-50 flex items-center justify-center overflow-y-auto overscroll-contain p-4"
        onClick={(e) => e.target === e.currentTarget && onClose()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={modalTitleId}
        aria-describedby={modalDescriptionId}
      >
        <div className="relative w-full max-w-[440px] rounded-lg border border-neon-yellow/30 bg-black/95 p-5 text-center shadow-[0_0_80px_rgba(255,230,0,0.12)] backdrop-blur-2xl animate-fade-up sm:p-6">
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar aviso de mantenimiento"
            className="absolute right-4 top-4 z-20 flex h-9 w-9 items-center justify-center rounded-full text-white/60 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--neon-yellow)]"
          >
            <X size={18} aria-hidden="true" />
          </button>

          <div className="relative z-10 flex flex-col items-center gap-5 py-8">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-neon-yellow bg-neon-yellow/10">
              <ShieldCheck size={32} aria-hidden="true" style={{ color: "var(--neon-yellow)" }} />
            </div>
            <div>
              <h2 id={modalTitleId} className="mb-3 text-2xl font-black uppercase leading-none text-white">
                {VOTING_PAUSED_TITLE}
              </h2>
              <p id={modalDescriptionId} className="text-sm font-bold leading-relaxed text-white/65">
                {VOTING_PAUSED_MESSAGE}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="btn-neon mt-2 rounded-lg px-8 py-3 text-[12px] font-black uppercase tracking-[0.2em] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    );
  }

  const validateEmail = (e: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(normalizeEmail(e));
  };


  const validateEmailBeforeSubmit = () => {
    const normalized = normalizeEmail(email);

    if (!validateEmail(normalized)) {
      setError("Por favor ingresa un correo electrónico válido.");
      return null;
    }

    if (isDisposableEmail(normalized)) {
      setError("No se permiten correos temporales o desechables.");
      return null;
    }

    setEmail(normalized);
    return normalized;
  };

  const requestEmailCode = async () => {
    const normalizedEmail = validateEmailBeforeSubmit();

    if (!normalizedEmail) {
      return;
    }

    if (HCAPTCHA_SITE_KEY && !captchaToken) {
      setError("Completa la verificación anti-bot para continuar.");
      return;
    }

    setLoading(true);

    try {
      const deviceFingerprint = await getBrowserFingerprint();
      const result = await sendVoteVerificationCode({
        email: normalizedEmail,
        videoId: video.id,
        deviceFingerprint,
        captchaToken,
        website,
      });

      if (result.success) {
        savePendingMagicVote(normalizedEmail, video.id);
        setStep("code");
        setError("");
      } else {
        setError(result.error || "No pudimos enviar el enlace.");
        setCaptchaToken("");
        captchaRef.current?.resetCaptcha();
      }
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
      setCaptchaToken("");
      captchaRef.current?.resetCaptcha();
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (step === "email") {
      await requestEmailCode();
    }
  };

  const primaryButtonLabel = loading
    ? "Procesando…"
    : step === "email"
      ? "Enviar enlace seguro"
      : "Revisa tu correo";

  const primaryButtonDisabled = loading || step === "code";

  return (
    <div
      className="fixed inset-0 modal-backdrop z-50 flex items-center justify-center overflow-y-auto overscroll-contain p-3 sm:p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby={modalTitleId}
      aria-describedby={modalDescriptionId}
    >
      <div
        className="relative max-h-[calc(100vh-1.5rem)] w-full max-w-[520px] overflow-y-auto rounded-lg border border-neon-yellow/30 bg-black/95 p-4 text-left shadow-[0_0_80px_rgba(255,230,0,0.12)] backdrop-blur-2xl animate-fade-up sm:max-h-[calc(100vh-2rem)] sm:p-6"
      >
        <div
          className="pointer-events-none absolute inset-0 rounded-lg opacity-[0.04]"
          style={{
            backgroundImage: "url('https://globalpizza.party/assets/pizzadao-logo-DYYagcIv.png')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />

        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar confirmación de voto"
          className="absolute right-4 top-4 z-20 flex h-9 w-9 items-center justify-center rounded-full text-white/60 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--neon-yellow)]"
          style={{ color: "var(--text-secondary)" }}
        >
          <X size={18} aria-hidden="true" />
        </button>

        {step === "success" ? (
          <div className="relative z-10 flex flex-col items-center gap-5 py-8 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-neon-yellow bg-neon-yellow/10 animate-pulse-neon">
              <CheckCircle2 size={32} aria-hidden="true" style={{ color: "var(--neon-yellow)" }} />
            </div>
            <div>
              <h3 className="mb-2 text-xl font-black uppercase leading-none" style={{ color: "var(--neon-yellow)" }}>
                Voto registrado
              </h3>
              <p className="px-4 text-[12px] font-bold uppercase leading-relaxed tracking-widest" style={{ color: "var(--text-secondary)" }}>
                Tu voto por <strong className="text-white">{`"${video.title}"`}</strong> fue enviado con éxito.
              </p>
            </div>
          </div>
        ) : (
          <div className="relative z-10">
            <div className="mb-5 pr-10">
              <div className="mb-3 flex items-center gap-2">
                <ShieldCheck size={16} aria-hidden="true" style={{ color: "var(--neon-yellow)" }} />
                <span className="text-[11px] font-black uppercase tracking-widest" style={{ color: "var(--neon-yellow)" }}>
                  Voto seguro
                </span>
              </div>
              <h2 id={modalTitleId} className="mb-2 text-2xl font-black uppercase leading-none text-white sm:text-3xl">
                Confirmar voto
              </h2>
              <p id={modalDescriptionId} className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "var(--text-secondary)" }}>
                Verifica tu correo para registrar este voto
              </p>
            </div>

            <div className="mb-5 flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.035] p-3">
              <Image
                src={`https://img.youtube.com/vi/${video.youtubeId}/hqdefault.jpg`}
                alt={video.title}
                width={80}
                height={80}
                className="h-14 w-14 shrink-0 rounded-lg border border-white/10 object-cover"
              />
              <div className="min-w-0">
                <p className="mb-1 text-[9px] font-black uppercase tracking-[0.22em] text-neon-yellow/85">
                  Canción elegida
                </p>
                <p className="truncate text-sm font-black uppercase leading-tight text-white">
                  {video.title}
                </p>
                <p className="mt-1 truncate text-[10px] font-bold uppercase tracking-[0.12em] text-white/40">
                  {video.artist}
                </p>
              </div>
            </div>

            <div className="mb-5 grid grid-cols-3 gap-2 text-center text-[9px] font-black uppercase tracking-widest text-white/35">
              {["Correo", "Enlace", "Voto"].map((label, index) => {
                const active = (step === "email" && index === 0) || (step === "code" && index === 1);
                return (
                  <span
                    key={label}
                    className={`rounded-lg border px-2 py-2 ${active ? "border-neon-yellow bg-neon-yellow/10 text-neon-yellow" : "border-white/10 bg-white/[0.02]"}`}
                  >
                    {label}
                  </span>
                );
              })}
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="w-full">
                <label htmlFor={emailInputId} className="mb-2 block text-[10px] font-black uppercase tracking-widest text-white/50">
                  Correo electrónico
                </label>
                <input
                  id={emailInputId}
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  className="input-neon w-full rounded-lg px-4 py-3 text-[14px] tracking-wide"
                  required
                  autoComplete="email"
                  spellCheck={false}
                  disabled={step === "code" || loading}
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? errorId : undefined}
                />
                {step === "email" && (
                  <p className="mt-2 text-[11px] font-bold leading-relaxed text-white/45">
                    El enlace del correo confirma y registra el voto automáticamente.
                  </p>
                )}
              </div>

              <input
                type="text"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                tabIndex={-1}
                autoComplete="off"
                name="website"
                aria-hidden="true"
                className="hidden"
              />

              {step === "code" && (
                <div className="rounded-lg border border-neon-yellow/20 bg-neon-yellow/[0.055] p-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neon-yellow/10 text-neon-yellow">
                      <MailCheck size={18} aria-hidden="true" />
                    </div>
                    <div>
                      <p className="text-sm font-black uppercase leading-tight text-white">
                        Revisa tu correo
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-white/55">
                        Te enviamos un enlace seguro. Toca <strong className="text-white">Confirmar y votar</strong> en el email: el voto se registrará automáticamente y verás una página confirmando que tu voto fue registrado.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {step === "email" && HCAPTCHA_SITE_KEY && (
                <div className="flex w-full justify-center rounded-lg border border-white/10 bg-white/[0.02] py-3">
                  <HCaptcha
                    ref={captchaRef}
                    sitekey={HCAPTCHA_SITE_KEY}
                    theme="dark"
                    size="compact"
                    onVerify={setCaptchaToken}
                    onExpire={() => setCaptchaToken("")}
                    onError={() => setCaptchaToken("")}
                  />
                </div>
              )}

              {step === "email" && !HCAPTCHA_SITE_KEY && (
                <p className="text-center text-[10px] font-bold uppercase tracking-widest text-white/40">
                  Anti-bot activo en servidor
                </p>
              )}

              {step === "code" && (
                <div className="flex justify-center">
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => {
                      setStep("email");
                      setError("");
                      setCaptchaToken("");
                      clearPendingMagicVote();
                      captchaRef.current?.resetCaptcha();
                    }}
                    className="text-[10px] font-black uppercase tracking-widest text-white/40 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--neon-yellow)]"
                  >
                    Cambiar correo
                  </button>
                </div>
              )}

              {error && (
                <p id={errorId} role="alert" aria-live="polite" className="rounded-lg border border-red-400/20 bg-red-500/10 px-3 py-2 text-center text-[11px] font-bold uppercase tracking-wider" style={{ color: "#FFAAAA" }}>
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={primaryButtonDisabled}
                className="btn-neon mt-1 flex min-h-11 w-full items-center justify-center gap-2 rounded-lg px-3 py-3 text-[12px] font-black uppercase tracking-[0.16em] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black"
              >
                {loading && <Loader2 size={15} className="animate-spin" aria-hidden="true" />}
                {primaryButtonLabel}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
