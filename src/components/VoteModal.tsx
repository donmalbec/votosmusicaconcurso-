"use client";

import { useState, useEffect, useRef, useId } from "react";
import { X, ShieldCheck, CheckCircle2, Link2, MailCheck, Loader2 } from "lucide-react";
import HCaptcha from "@hcaptcha/react-hcaptcha";
import { Video } from "@/lib/data";
import { useVoteStore } from "@/lib/store";
import { getBrowserFingerprint, isDisposableEmail, normalizeEmail } from "@/lib/security";
import { sendVoteVerificationCode, verifyVoteEmailCode } from "@/app/actions";

interface VoteModalProps {
  video: Video | null;
  onClose: () => void;
  onSuccess: (email: string) => void;
  verifiedByMagicLink?: boolean;
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

export function VoteModal({ video, onClose, onSuccess, verifiedByMagicLink = false }: VoteModalProps) {
  const modalTitleId = useId();
  const modalDescriptionId = useId();
  const emailInputId = useId();
  const codeInputId = useId();
  const errorId = useId();
  const [email, setEmail] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [website, setWebsite] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"email" | "code" | "success">("email");
  const [showCodeInput, setShowCodeInput] = useState(false);
  const captchaRef = useRef<HCaptcha>(null);

  const { castVote } = useVoteStore();

  useEffect(() => {
    let cancelled = false;

    queueMicrotask(() => {
      if (cancelled) return;
      const pendingVote = getPendingMagicVote(video?.id);
      setStep(pendingVote && verifiedByMagicLink ? "code" : "email");
      setEmail(pendingVote?.email || "");
      setCaptchaToken("");
      setVerificationCode("");
      setShowCodeInput(false);
      setWebsite("");
      setError("");
      captchaRef.current?.resetCaptcha();
    });

    return () => {
      cancelled = true;
    };
  }, [video?.id, verifiedByMagicLink]);

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
        deviceFingerprint,
        captchaToken,
        website,
      });

      if (result.success) {
        if (result.alreadyVerified) {
          await submitVerifiedVote(deviceFingerprint, normalizedEmail);
          return;
        }

        savePendingMagicVote(normalizedEmail, video.id);
        setStep("code");
        setVerificationCode("");
        setShowCodeInput(false);
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

  const submitVerifiedVote = async (deviceFingerprint?: string, emailOverride = email) => {
    const fingerprint = deviceFingerprint || await getBrowserFingerprint();
    const normalizedEmail = normalizeEmail(emailOverride);

    await new Promise((resolve) => setTimeout(resolve, 800));

    const result = await castVote(normalizedEmail, video.id, fingerprint, website);
    if (result.success) {
      clearPendingMagicVote();
      setStep("success");
      setTimeout(() => {
        onSuccess(normalizedEmail);
        onClose();
      }, 2500);
      return;
    }

    setError(
      result.error === "Verifica tu correo antes de votar."
        ? "Abre el enlace mágico desde este navegador y vuelve a intentar."
        : result.error || "Ocurrió un error"
    );
  };

  const verifyCodeAndVote = async () => {
    const normalizedEmail = validateEmailBeforeSubmit();

    if (!normalizedEmail) {
      return;
    }

    if (!verificationCode.trim()) {
      setError("Ingresa el código enviado a tu correo.");
      return;
    }

    setLoading(true);

    try {
      const verification = await verifyVoteEmailCode(normalizedEmail, verificationCode);
      if (!verification.success) {
        setError(verification.error || "Código incorrecto o expirado.");
        return;
      }

      await submitVerifiedVote(undefined, normalizedEmail);
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const voteAfterMagicLink = async () => {
    const normalizedEmail = validateEmailBeforeSubmit();

    if (!normalizedEmail) {
      return;
    }

    setError("");
    setLoading(true);

    try {
      await submitVerifiedVote(undefined, normalizedEmail);
    } catch {
      setError("Abre el enlace mágico desde este navegador y vuelve a intentar.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (step === "email") {
      await requestEmailCode();
      return;
    }

    if (showCodeInput && verificationCode.trim()) {
      await verifyCodeAndVote();
      return;
    }

    await voteAfterMagicLink();
  };

  const primaryButtonLabel = loading
    ? "Procesando…"
    : step === "email"
      ? "Enviar enlace mágico"
      : showCodeInput && verificationCode.trim()
        ? "Verificar y votar"
        : "Ya abrí el enlace";

  return (
    <div
      className="fixed inset-0 modal-backdrop z-50 flex items-center justify-center overflow-y-auto overscroll-contain p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby={modalTitleId}
      aria-describedby={modalDescriptionId}
    >
      <div
        className="relative w-full max-w-[440px] rounded-lg border border-neon-yellow/30 bg-black/95 p-5 text-left shadow-[0_0_80px_rgba(255,230,0,0.12)] backdrop-blur-2xl animate-fade-up sm:p-6"
      >
        <div
          className="pointer-events-none absolute inset-0 rounded-lg opacity-5"
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
              <h2 id={modalTitleId} className="mb-2 text-3xl font-black uppercase leading-none text-white">
                Confirmar voto
              </h2>
              <p id={modalDescriptionId} className="truncate text-[11px] font-bold uppercase tracking-widest" style={{ color: "var(--text-secondary)" }}>
                {`"${video.title}"`}
              </p>
            </div>

            <div className="mb-5 grid grid-cols-3 gap-2 text-center text-[9px] font-black uppercase tracking-widest text-white/35">
              <span className={`rounded-full border px-2 py-1.5 ${step === "email" ? "border-neon-yellow bg-neon-yellow/10 text-neon-yellow" : "border-white/10"}`}>
                Correo
              </span>
              <span className={`rounded-full border px-2 py-1.5 ${step === "code" ? "border-neon-yellow bg-neon-yellow/10 text-neon-yellow" : "border-white/10"}`}>
                Enlace
              </span>
              <span className="rounded-full border border-white/10 px-2 py-1.5">
                Voto
              </span>
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
                <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                  <div className="mb-3 flex items-start gap-3">
                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neon-yellow/10 text-neon-yellow">
                      {verifiedByMagicLink ? <Link2 size={18} aria-hidden="true" /> : <MailCheck size={18} aria-hidden="true" />}
                    </div>
                    <div>
                      <p className="text-sm font-black uppercase leading-tight text-white">
                        {verifiedByMagicLink ? "Correo verificado" : "Revisa tu correo"}
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-white/55">
                        {verifiedByMagicLink
                          ? "Ya puedes confirmar el voto en este navegador."
                          : "Abre el enlace mágico y vuelve a esta ventana para finalizar."}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => setShowCodeInput((visible) => !visible)}
                    className="text-[10px] font-black uppercase tracking-widest text-white/50 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--neon-yellow)]"
                  >
                    {showCodeInput ? "Usar enlace mágico" : "Tengo un código numérico"}
                  </button>
                  {showCodeInput && (
                    <div className="mt-3">
                      <label htmlFor={codeInputId} className="mb-2 block text-[10px] font-black uppercase tracking-widest text-white/50">
                        Código numérico
                      </label>
                      <input
                        id={codeInputId}
                        name="verificationCode"
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        spellCheck={false}
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value)}
                        placeholder="000000"
                        className="input-neon w-full rounded-lg px-4 py-3 text-center text-[16px] tracking-[0.35em]"
                      />
                    </div>
                  )}
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
                      setCaptchaToken("");
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
                disabled={loading}
                className="btn-neon mt-1 flex w-full items-center justify-center gap-2 rounded-lg py-3 text-[12px] font-black uppercase tracking-[0.2em] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black"
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
