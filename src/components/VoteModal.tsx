"use client";

import { useState, useEffect } from "react";
import { X, Mail, Shield, AlertCircle, CheckCircle2 } from "lucide-react";
import { Video } from "@/lib/data";
import { useVoteStore } from "@/lib/store";
import { getClientIP } from "@/app/actions";
import { getBrowserFingerprint, isDisposableEmail } from "@/lib/security";

interface VoteModalProps {
  video: Video | null;
  onClose: () => void;
  onSuccess: (email: string) => void;
}

const CAPTCHA_QUESTIONS = [
  { q: "¿Cuántas letras tiene 'PIZZA'?", a: "5" },
  { q: "¿Cuánto es 3 + 4?", a: "7" },
  { q: "¿Cuánto es 8 - 3?", a: "5" },
  { q: "¿Cuántas letras tiene 'WEB3'?", a: "4" },
  { q: "¿Cuánto es 2 × 3?", a: "6" },
];

export function VoteModal({ video, onClose, onSuccess }: VoteModalProps) {
  const [email, setEmail] = useState("");
  const [captchaAnswer, setCaptchaAnswer] = useState("");
  const [captchaQ, setCaptchaQ] = useState(CAPTCHA_QUESTIONS[0]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"form" | "success">("form");

  const { castVote } = useVoteStore();

  useEffect(() => {
    const q = CAPTCHA_QUESTIONS[Math.floor(Math.random() * CAPTCHA_QUESTIONS.length)];
    setCaptchaQ(q);
    setStep("form");
    setEmail("");
    setCaptchaAnswer("");
    setError("");
  }, [video]);

  if (!video) return null;

  const validateEmail = (e: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(e);
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!validateEmail(email)) {
      setError("Por favor ingresa un correo electrónico válido.");
      return;
    }

    if (isDisposableEmail(email)) {
      setError("No se permiten correos temporales o desechables.");
      return;
    }

    if (captchaAnswer.trim() !== captchaQ.a) {
      setError("Respuesta de verificación incorrecta. ¿Eres un bot? 🤔");
      return;
    }

    setLoading(true);

    try {
      // 1. Obtener IP real del servidor
      const ip = await getClientIP();
      
      // 2. Generar huella digital del dispositivo
      const deviceId = await getBrowserFingerprint();

      // 3. Pequeña demora para efecto visual y prevenir spamming rápido
      await new Promise((resolve) => setTimeout(resolve, 800));

      const result = await castVote(email, video.id, video.title, video.artist, ip, deviceId);
      if (result.success) {
        setStep("success");
        setTimeout(() => {
          onSuccess(email);
          onClose();
        }, 2500);
      } else {
        setError(result.error || "Ocurrió un error");
      }
    } catch (err) {
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
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
                Tu voto por <br/> <strong className="text-white">"{video.title}"</strong> <br/> fue enviado con éxito 🍕
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
                "{video.title}"
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
                />
              </div>

              {/* Captcha */}
              <div className="w-full">
                <p className="text-[9px] text-white/50 mb-1.5 font-bold uppercase tracking-widest">
                  Anti-Bot: {captchaQ.q}
                </p>
                <input
                  type="text"
                  value={captchaAnswer}
                  onChange={(e) => setCaptchaAnswer(e.target.value)}
                  placeholder="Respuesta..."
                  className="input-neon px-4 py-2.5 text-center text-[11px] w-full rounded-full uppercase tracking-wider"
                  required
                />
              </div>

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
                {loading ? "Procesando..." : "🍕 Emitir Voto"}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
