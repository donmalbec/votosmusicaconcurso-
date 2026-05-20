"use client";

import { useState, useEffect, useRef } from "react";
import { X, Shield, CheckCircle2 } from "lucide-react";
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

  if (!video) return null;

  const validateEmail = (e: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(e);
  };


  const validateEmailBeforeSubmit = () => {
    if (!validateEmail(email)) {
      setError("Por favor ingresa un correo electrónico válido.");
      return false;
    }

    if (isDisposableEmail(email)) {
      setError("No se permiten correos temporales o desechables.");
      return false;
    }

    return true;
  };

  const requestEmailCode = async () => {
    if (!validateEmailBeforeSubmit()) {
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
        email,
        deviceFingerprint,
        captchaToken,
        website,
      });

      if (result.success) {
        if (result.alreadyVerified) {
          await submitVerifiedVote(deviceFingerprint);
          return;
        }

        savePendingMagicVote(email, video.id);
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

  const submitVerifiedVote = async (deviceFingerprint?: string) => {
    const fingerprint = deviceFingerprint || await getBrowserFingerprint();

    await new Promise((resolve) => setTimeout(resolve, 800));

    const result = await castVote(email, video.id, fingerprint, website);
    if (result.success) {
      clearPendingMagicVote();
      setStep("success");
      setTimeout(() => {
        onSuccess(email);
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
    if (!validateEmailBeforeSubmit()) {
      return;
    }

    if (!verificationCode.trim()) {
      setError("Ingresa el código enviado a tu correo.");
      return;
    }

    setLoading(true);

    try {
      const verification = await verifyVoteEmailCode(email, verificationCode);
      if (!verification.success) {
        setError(verification.error || "Código incorrecto o expirado.");
        return;
      }

      await submitVerifiedVote();
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const voteAfterMagicLink = async () => {
    if (!validateEmailBeforeSubmit()) {
      return;
    }

    setError("");
    setLoading(true);

    try {
      await submitVerifiedVote();
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

  return (
    <div
      className="fixed inset-0 modal-backdrop z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-[360px] h-[360px] sm:w-[440px] sm:h-[440px] rounded-full relative flex flex-col items-center justify-center p-8 text-center animate-fade-up"
        style={{ 
          background: "rgba(10,10,10,0.95)",
          border: "4px dashed var(--neon-yellow)", 
          boxShadow: "0 0 80px rgba(255,230,0,0.15), inset 0 0 60px rgba(255,230,0,0.05)",
          backdropFilter: "blur(20px)"
        }}
      >
        {/* Faint Pizza Background Watermark */}
        <div 
          className="absolute inset-0 rounded-full opacity-5 pointer-events-none"
          style={{
            backgroundImage: "url('https://globalpizza.party/assets/pizzadao-logo-DYYagcIv.png')",
            backgroundSize: "cover",
            backgroundPosition: "left center"
          }}
        />

        {/* Close Button - Placed at top center to fit circle */}
        <button
          onClick={onClose}
          className="absolute top-6 w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors z-20"
          style={{ color: "var(--text-secondary)" }}
        >
          <X size={16} />
        </button>

        {step === "success" ? (
          <div className="text-center flex flex-col items-center gap-4 relative z-10 mt-8">
            <div className="w-16 h-16 rounded-full flex items-center justify-center animate-pulse-neon"
              style={{ background: "rgba(255,230,0,0.1)", border: "2px solid var(--neon-yellow)" }}>
              <CheckCircle2 size={32} style={{ color: "var(--neon-yellow)" }} />
            </div>
            <div>
              <h3 className="text-xl font-black mb-1 uppercase tracking-tighter" style={{ color: "var(--neon-yellow)" }}>¡Voto Registrado!</h3>
              <p className="text-[11px] uppercase tracking-widest px-4 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                Tu voto por <br/> <strong className="text-white">{`"${video.title}"`}</strong> <br/> fue enviado con éxito 🍕
              </p>
            </div>
          </div>
        ) : (
          <div className="w-full max-w-[260px] relative z-10 mt-8">
            {/* Header */}
            <div className="mb-6">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Shield size={12} style={{ color: "var(--neon-yellow)" }} />
                <span className="text-[10px] uppercase font-black tracking-widest" style={{ color: "var(--neon-yellow)" }}>Voto Seguro</span>
              </div>
              <h2 className="text-2xl font-black text-white uppercase tracking-tighter leading-none mb-2">
                Confirmar <br/> Voto
              </h2>
              <p className="text-[10px] tracking-widest uppercase truncate px-2" style={{ color: "var(--text-secondary)" }}>
                {`"${video.title}"`}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col items-center gap-3">
              {/* Email */}
              <div className="w-full">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Tu correo electrónico"
                  className="input-neon px-4 py-2.5 text-center text-[11px] w-full rounded-full uppercase tracking-wider"
                  required
                  autoFocus
                  disabled={step === "code" || loading}
                />
              </div>

              <input
                type="text"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                className="hidden"
              />

              {step === "code" && (
                <div className="w-full flex flex-col items-center gap-2">
                  <p className="text-[9px] text-white/50 mb-1.5 font-bold uppercase tracking-widest">
                    Te enviamos un enlace mágico. Ábrelo desde este navegador.
                  </p>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => setShowCodeInput((visible) => !visible)}
                    className="text-[9px] uppercase tracking-widest text-white/50 hover:text-white transition-colors"
                  >
                    {showCodeInput ? "Usar enlace mágico" : "Tengo un código numérico"}
                  </button>
                  {showCodeInput && (
                    <input
                      type="text"
                      inputMode="numeric"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      placeholder="000000"
                      className="input-neon px-4 py-2.5 text-center text-[13px] w-full rounded-full uppercase tracking-[0.35em]"
                    />
                  )}
                </div>
              )}

              {step === "email" && HCAPTCHA_SITE_KEY && (
                <div className="w-full flex justify-center scale-[0.78] origin-center -my-2">
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
                <p className="text-[9px] text-white/40 text-center font-bold uppercase tracking-widest">
                  Anti-bot activo en servidor
                </p>
              )}

              {step === "code" && (
                <div className="flex flex-col items-center gap-2">
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => {
                      setStep("email");
                      setCaptchaToken("");
                      captchaRef.current?.resetCaptcha();
                    }}
                    className="text-[9px] uppercase tracking-widest text-white/40 hover:text-white transition-colors"
                  >
                    Cambiar correo
                  </button>
                </div>
              )}

              {/* Error */}
              {error && (
                <p className="text-[9px] uppercase tracking-wider text-center" style={{ color: "#FF8888" }}>
                  {error}
                </p>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="btn-neon py-3 text-[11px] font-black w-full mt-2 rounded-full uppercase tracking-[0.2em]"
              >
                {loading
                  ? "Procesando..."
                  : step === "email"
                    ? "Enviar Enlace"
                    : showCodeInput && verificationCode.trim()
                      ? "Verificar y Votar"
                      : "Ya Abrí El Enlace"}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
