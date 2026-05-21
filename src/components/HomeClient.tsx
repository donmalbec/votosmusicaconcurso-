"use client";

import Image from "next/image";
import { useState, useEffect, useMemo } from "react";
import { AlertTriangle, ArrowDown, BarChart3, CheckCircle2, MailCheck, MousePointerClick, ShieldCheck, X } from "lucide-react";
import { Header } from "@/components/Header";
import { VideoCard } from "@/components/VideoCard";
import { VoteModal } from "@/components/VoteModal";
import { VIDEOS, type Video } from "@/lib/data";
import {
  VOTING_PAUSED,
  VOTING_PAUSED_MESSAGE,
  VOTING_PAUSED_TITLE,
} from "@/lib/maintenance";
import { useVoteStore } from "@/lib/store";

const PENDING_MAGIC_VOTE_KEY = "pizza_pending_magic_vote";

export function HomeClient() {
  const { votes, fetchVotes, userVotedEmail } = useVoteStore();
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [completedMagicVideoId, setCompletedMagicVideoId] = useState<string | null>(null);
  const [voteNotice, setVoteNotice] = useState<{
    type: "success" | "duplicate" | "error";
    videoId?: string;
  } | null>(null);

  const hasVoted = userVotedEmail !== null || completedMagicVideoId !== null;

  // Local state to prevent hydration mismatch
  const [isLoaded, setIsLoaded] = useState(false);

  // Sync state from store
  useEffect(() => {
    fetchVotes();
  }, [fetchVotes]);

  useEffect(() => {
    let cancelled = false;

    queueMicrotask(() => {
      if (!cancelled) {
        setIsLoaded(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isLoaded || typeof window === "undefined") return;

    const url = new URL(window.location.href);
    const voteSuccess = url.searchParams.get("vote_success") === "1";
    const voteError = url.searchParams.get("vote_error");
    const videoId = url.searchParams.get("video_id") || undefined;

    if (voteSuccess) {
      const completedVideo = VIDEOS.find((video) => video.id === videoId);
      queueMicrotask(() => {
        if (completedVideo) {
          setCompletedMagicVideoId(completedVideo.id);
        }

        setVoteNotice({ type: "success", videoId: completedVideo?.id });
      });
      fetchVotes();

      try {
        window.localStorage.removeItem(PENDING_MAGIC_VOTE_KEY);
      } catch {}
    }

    if (voteError && !voteSuccess) {
      queueMicrotask(() => {
        setVoteNotice({
          type: voteError === "duplicate" ? "duplicate" : "error",
          videoId,
        });
      });
    }

    if (voteSuccess || voteError) {
      url.searchParams.delete("vote_success");
      url.searchParams.delete("vote_error");
      url.searchParams.delete("video_id");
      window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
    }
  }, [fetchVotes, isLoaded]);

  const sortedVideos = useMemo(() => [...VIDEOS].sort((a, b) => {
    const votesA = votes[a.id] || 0;
    const votesB = votes[b.id] || 0;

    if (votesB !== votesA) {
      return votesB - votesA;
    }

    return 0;
  }), [votes]);

  const rankByVideoId = useMemo(
    () => new Map(sortedVideos.map((video, index) => [video.id, index + 1])),
    [sortedVideos]
  );

  const leadingVideoId = sortedVideos[0]?.id;
  const noticedVideo = useMemo(
    () => VIDEOS.find((video) => video.id === voteNotice?.videoId) || null,
    [voteNotice?.videoId]
  );

  const liveTop = useMemo(() => sortedVideos.slice(0, 5), [sortedVideos]);
  const liveMaxVotes = useMemo(
    () => Math.max(1, ...liveTop.map((video) => votes[video.id] || 0)),
    [liveTop, votes]
  );

  if (!isLoaded && !VOTING_PAUSED) return <div className="min-h-screen bg-black" />;

  return (
    <div className="min-h-screen flex flex-col items-center relative" style={{ background: "#000" }}>
      {/* Fixed Cinematic Video Background - Full Frame (Globo Visible) */}
      <div className="fixed inset-0 z-0 pointer-events-none bg-black flex items-center justify-center p-4">
        <video
          src="https://musica.pizzadao.org/assets/bus-animated.mp4"
          autoPlay
          muted
          loop
          playsInline
          aria-hidden="true"
          className="w-full h-full object-contain opacity-80 brightness-110 saturate-110"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/90" />
      </div>

      <Header />

      {voteNotice && (
        <div
          role="status"
          aria-live="polite"
          className="fixed left-1/2 top-20 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-lg border border-neon-yellow/35 bg-black/95 p-4 text-left shadow-[0_24px_80px_rgba(0,0,0,0.7)] backdrop-blur-xl"
        >
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neon-yellow/10 text-neon-yellow">
              {voteNotice.type === "success" ? (
                <CheckCircle2 size={19} aria-hidden="true" />
              ) : (
                <AlertTriangle size={19} aria-hidden="true" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-black uppercase leading-tight text-white">
                {voteNotice.type === "success"
                  ? "Voto registrado"
                  : voteNotice.type === "duplicate"
                    ? "Voto ya registrado"
                    : "No pudimos finalizar"}
              </p>
              <p className="mt-1 text-xs font-bold leading-relaxed text-white/60">
                {voteNotice.type === "success"
                  ? `Tu voto${noticedVideo ? ` por "${noticedVideo.title}"` : ""} fue confirmado correctamente.`
                  : voteNotice.type === "duplicate"
                    ? "Ese correo o dispositivo ya tenía un voto registrado en el concurso."
                    : "El correo fue verificado, pero necesitamos que intentes confirmar el voto nuevamente."}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setVoteNotice(null)}
              aria-label="Cerrar aviso"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white/55 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--neon-yellow)]"
            >
              <X size={16} aria-hidden="true" />
            </button>
          </div>
        </div>
      )}

      <main className="w-full max-w-7xl px-4 py-12 sm:px-6 sm:py-16 flex flex-col items-center relative z-10">

        {/* Concurso principal */}
        <section className="w-full max-w-6xl animate-fade-up">
          <div className="bg-black/72 backdrop-blur-2xl border border-white/10 rounded-lg p-5 text-center shadow-[0_24px_90px_rgba(0,0,0,0.48)] sm:p-8 md:p-10">

            <div className="mb-9 md:mb-10">
              <div className="mb-7 flex items-center justify-center gap-4 sm:gap-6">
                <div className="w-[76px] h-16 md:w-[96px] md:h-20 overflow-hidden relative flex items-center justify-start">
                  <Image
                    src="https://globalpizza.party/assets/pizzadao-logo-DYYagcIv.png"
                    alt="PizzaDAO"
                    width={96}
                    height={80}
                    className="absolute left-0 h-full w-auto max-w-none"
                  />
                </div>

                <span className="text-2xl font-black text-white/40">×</span>

                {/* MusicaW3 Logo */}
                <Image
                  src="https://www.musicaw3.com/logo-mw3.png"
                  alt="MusicaW3"
                  width={128}
                  height={80}
                  className="h-16 md:h-20 w-auto object-contain"
                />
              </div>

              <div className="relative mx-auto mb-5 max-w-5xl">
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -inset-x-6 -inset-y-4"
                  style={{ background: "radial-gradient(ellipse at center, rgba(0,0,0,0.55), transparent 70%)" }}
                />
                <h1 className="relative text-[clamp(2rem,8vw,4.5rem)] font-black uppercase leading-[0.95] text-white">
                  Música y Pizzas <br />
                  <span style={{ color: "var(--neon-yellow)" }}>en Español</span>
                </h1>
              </div>
              <p className="font-mono text-xs font-bold uppercase tracking-[0.28em] text-neon-yellow sm:text-sm md:text-base">
                PizzaDAO x MusicaW3
              </p>
              <p className="mx-auto mt-4 max-w-2xl text-sm font-bold leading-relaxed text-white/70 sm:text-base">
                Escucha las canciones, elige tu favorita y confirma tu voto desde el enlace que llegará a tu correo.
              </p>
              <div className="mx-auto mt-7 flex max-w-xl flex-col gap-3 sm:flex-row sm:justify-center">
                <a
                  href="#participantes"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-neon-yellow px-7 py-3.5 text-[12px] font-black uppercase tracking-[0.18em] text-black shadow-[0_4px_20px_rgba(255,230,0,0.18)] transition duration-200 hover:-translate-y-px hover:shadow-[0_8px_28px_rgba(255,230,0,0.45)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--neon-yellow)] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                >
                  <ArrowDown size={15} aria-hidden="true" />
                  Votar ahora
                </a>
                <a
                  href="#ranking"
                  className="inline-flex items-center justify-center gap-2 rounded-full border-[1.5px] border-neon-yellow bg-transparent px-7 py-3.5 text-[12px] font-black uppercase tracking-[0.18em] text-neon-yellow transition duration-200 hover:-translate-y-px hover:bg-neon-yellow/10 hover:shadow-[0_8px_28px_rgba(255,230,0,0.25)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--neon-yellow)] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                >
                  <BarChart3 size={15} aria-hidden="true" />
                  Ver ranking
                </a>
              </div>
            </div>

            {VOTING_PAUSED && (
              <div
                role="status"
                aria-live="polite"
                className="mb-10 border-y border-neon-yellow/35 bg-neon-yellow/10 px-4 py-5 text-center shadow-[0_0_40px_rgba(255,230,0,0.08)] sm:px-6"
              >
                <p className="mb-2 text-[11px] font-black uppercase tracking-[0.34em] text-neon-yellow">
                  {VOTING_PAUSED_TITLE}
                </p>
                <p className="mx-auto max-w-3xl text-sm font-bold leading-relaxed text-white/85 sm:text-base">
                  {VOTING_PAUSED_MESSAGE}
                </p>
              </div>
            )}

            <div className="mb-8 border-y border-neon-yellow/20 bg-white/[0.025] py-6 shadow-[0_0_50px_rgba(255,230,0,0.05)] sm:mb-10 sm:py-8">
              <h3 className="mb-7 px-2 text-[10px] font-black uppercase tracking-[0.28em] text-white/60 sm:text-[11px] sm:tracking-[0.38em]">
                Premios del Concurso
              </h3>
              <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden min-[480px]:grid min-[480px]:snap-none min-[480px]:grid-cols-3 min-[480px]:gap-6 min-[480px]:overflow-visible min-[480px]:px-0 min-[480px]:pb-0 md:gap-10">
                <div className="flex min-w-[62%] shrink-0 snap-center flex-col min-[480px]:min-w-0">
                  <span className="mb-2 text-3xl font-black text-white sm:text-5xl md:text-6xl">$200</span>
                  <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-white/70 sm:text-sm sm:tracking-[0.18em]">1er Lugar</span>
                </div>
                <div className="flex min-w-[62%] shrink-0 snap-center flex-col border-neon-yellow/10 min-[480px]:min-w-0 min-[480px]:border-x min-[480px]:px-2">
                  <span className="mb-2 text-3xl font-black text-white sm:text-5xl md:text-6xl">$100</span>
                  <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-white/70 sm:text-sm sm:tracking-[0.18em]">2do Lugar</span>
                </div>
                <div className="flex min-w-[62%] shrink-0 snap-center flex-col min-[480px]:min-w-0">
                  <span className="mb-2 text-3xl font-black text-white sm:text-5xl md:text-6xl">$50</span>
                  <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-white/70 sm:text-sm sm:tracking-[0.18em]">3er Lugar</span>
                </div>
              </div>
            </div>

            {/* Sponsor — its own slim row below the prize block */}
            <div className="mt-8 flex flex-col items-center gap-4 border-t border-white/5 pt-7">
              <p className="text-[10px] font-black uppercase tracking-[0.42em] text-white/50">
                Auspiciado por
              </p>
              <a href="https://metapool.app/" target="_blank" rel="noopener noreferrer" className="group flex items-center rounded-md transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--neon-yellow)] focus-visible:ring-offset-4 focus-visible:ring-offset-black">
                <Image
                  src="/sponsors/metapool-logo.svg"
                  alt="MetaPool Logo"
                  width={260}
                  height={64}
                  className="h-14 w-auto brightness-110"
                  priority
                  unoptimized
                />
              </a>
            </div>

            {/* Transition to participants */}
            <div className="mt-9 text-center">
              <h2 className="mb-3 text-2xl font-black uppercase leading-none text-white md:text-4xl">
                {VOTING_PAUSED ? (
                  <>
                    Votación <span style={{ color: "var(--neon-yellow)" }}>Pausada</span>
                  </>
                ) : (
                  <>
                    Vota por el <span style={{ color: "var(--neon-yellow)" }}>Ganador</span>
                  </>
                )}
              </h2>
              <p className="text-[11px] uppercase tracking-[0.42em] opacity-40">
                {VOTING_PAUSED
                  ? "Votos en pausa por mantenimiento"
                  : "Selecciona tu canción favorita abajo"}
              </p>
            </div>

          </div>
        </section>

        <section aria-labelledby="como-votar" className="mt-8 w-full max-w-6xl animate-fade-up" style={{ animationDelay: '120ms' }}>
          <div className="rounded-lg border border-neon-yellow/25 bg-black/78 p-4 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-2xl sm:p-6">
            <div className="mb-5 text-center">
              <p className="mb-2 text-[10px] font-black uppercase tracking-[0.32em] text-neon-yellow/80">
                Antes de votar
              </p>
              <h2 id="como-votar" className="text-2xl font-black uppercase leading-none text-white sm:text-3xl">
                Cómo registrar tu voto
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-sm font-bold leading-relaxed text-white/60">
                El voto cuenta solo cuando haces clic en el enlace de confirmación que enviamos a tu correo.
              </p>
            </div>

            <div className="relative mt-2 grid grid-cols-1 gap-0 md:grid-cols-3 md:gap-6">
              {/* Desktop: dashed line connecting the numerals horizontally */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute left-[16.6%] right-[16.6%] top-5 hidden border-t-2 border-dashed border-neon-yellow/40 md:block"
              />
              {[
                {
                  icon: MousePointerClick,
                  title: "1. Elige una canción",
                  copy: "Toca VOTAR en tu canción favorita. Puedes escucharla en YouTube antes de elegir.",
                },
                {
                  icon: ShieldCheck,
                  title: "2. Verifica que eres humano",
                  copy: "Ingresa tu correo y completa hCaptcha. Esto evita votos automáticos o abuso.",
                },
                {
                  icon: MailCheck,
                  title: "3. Confirma desde tu email",
                  copy: "Abre el correo y toca Confirmar y votar. Ahí recién queda registrado el voto.",
                },
              ].map(({ icon: Icon, title, copy }, i, arr) => (
                <div key={title} className="relative flex gap-4 md:flex-col md:items-center md:gap-3 md:text-center">
                  <div className="flex flex-col items-center md:contents">
                    <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neon-yellow font-mono text-lg font-black text-black shadow-[0_0_18px_rgba(255,230,0,0.35)]">
                      {i + 1}
                    </div>
                    {/* Mobile: dashed line dropping to the next numeral */}
                    {i < arr.length - 1 && (
                      <div className="my-2 w-0 flex-1 border-l-2 border-dashed border-neon-yellow/40 md:hidden" />
                    )}
                  </div>
                  <div className={`min-w-0 md:pb-0 ${i < arr.length - 1 ? "pb-9" : ""}`}>
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-neon-yellow/10 text-neon-yellow md:mx-auto">
                      <Icon size={19} aria-hidden="true" />
                    </div>
                    <h3 className="mb-2 text-sm font-black uppercase tracking-[0.12em] text-white">
                      {title}
                    </h3>
                    <p className="text-xs font-bold leading-relaxed text-white/55">
                      {copy}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="h-14 w-full flex-shrink-0 pointer-events-none sm:h-20" />

        {/* Ranking en vivo */}
        <section id="ranking" className="w-full max-w-4xl scroll-mt-24 relative z-10 animate-fade-up" style={{ animationDelay: '200ms' }}>
          <div className="bg-black/68 backdrop-blur-xl border border-white/10 rounded-lg p-4 shadow-[0_24px_80px_rgba(0,0,0,0.55)] sm:p-6 md:p-8">

            <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8 border-b border-white/5 pb-6">
              <h3 className="text-sm md:text-xl font-black uppercase tracking-widest text-white flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
                Ranking en Vivo
              </h3>
              <span className="rounded-lg border border-neon-yellow/20 bg-neon-yellow/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.28em] text-neon-yellow sm:px-4">
                Top 5 Tendencias
              </span>
            </div>

            <div className="flex flex-col gap-3 relative">
              {liveTop.map((video, index) => {
                const rowVotes = votes[video.id] || 0;
                const share = Math.round((rowVotes / liveMaxVotes) * 100);
                const isPodium = index < 3;
                const medal = ["🥇", "🥈", "🥉"][index];
                return (
                  <div
                    key={video.id}
                    className={`group rounded-lg border transition-colors duration-300 hover:border-neon-yellow/30 hover:bg-white/10 ${
                      isPodium
                        ? "border-neon-yellow/20 bg-neon-yellow/[0.04] p-4 sm:p-5"
                        : "border-white/5 bg-white/[0.03] p-3 sm:p-4"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3 sm:gap-5">
                        <div className="flex min-w-9 flex-col items-center justify-center sm:min-w-11">
                          {isPodium ? (
                            <>
                              <span className="text-2xl leading-none md:text-3xl" aria-hidden="true">{medal}</span>
                              <span className="mt-0.5 text-[9px] font-black text-white/40">#{index + 1}</span>
                            </>
                          ) : (
                            <span className="text-xl font-black text-white/20 md:text-2xl">#{index + 1}</span>
                          )}
                        </div>
                        <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                          <Image
                            src={`https://img.youtube.com/vi/${video.youtubeId}/hqdefault.jpg`}
                            alt={video.title}
                            width={96}
                            height={96}
                            className="w-12 h-12 rounded-lg object-cover border border-white/10 grayscale-[50%] transition duration-300 group-hover:grayscale-0"
                          />
                          <div className="flex min-w-0 flex-col justify-center">
                            <h4 className="mb-1 truncate text-[11px] font-black uppercase tracking-[0.12em] text-white md:text-xs">{video.title}</h4>
                            <p className="truncate text-[9px] uppercase tracking-[0.12em] text-white/40">{video.artist}</p>
                          </div>
                        </div>
                      </div>

                      <div className="ml-3 flex shrink-0 flex-col items-end justify-center">
                        <span className="text-xl md:text-2xl font-black text-white group-hover:text-neon-yellow transition-colors leading-none mb-1">
                          {rowVotes}
                        </span>
                        <span className="text-[8px] uppercase tracking-[0.3em] text-white/30 font-bold">Votos</span>
                      </div>
                    </div>

                    {/* Vote share relative to #1 (CSS width only) */}
                    <div aria-hidden="true" className="mt-3 h-1 w-full overflow-hidden rounded-full bg-white/5">
                      <div
                        className="h-full rounded-full bg-neon-yellow transition-[width] duration-500"
                        style={{ width: `${share}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        </section>

        <div className="h-16 w-full flex-shrink-0 pointer-events-none sm:h-24" />

        {/* Participantes */}
        <section id="participantes" className="mb-24 w-full scroll-mt-24">
          <div className="mb-8 rounded-lg border border-white/10 bg-black/70 p-4 text-center shadow-[0_20px_70px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:p-5">
            <p className="text-[10px] font-black uppercase tracking-[0.32em] text-neon-yellow/80">
              Participantes
            </p>
            <h2 className="mt-2 text-2xl font-black uppercase leading-none text-white sm:text-3xl">
              Toca VOTAR en una sola canción
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-xs font-bold leading-relaxed text-white/55 sm:text-sm">
              Después de enviar tu correo, busca el mensaje de Canción de Pizza y confirma el enlace para que el voto cuente.
            </p>
          </div>

          <div className="grid w-full grid-cols-2 justify-items-center gap-x-4 gap-y-12 sm:grid-cols-3 sm:gap-x-7 md:grid-cols-4 lg:grid-cols-5 xl:gap-x-10">
            {sortedVideos.map((video, i) => (
              <VideoCard
                key={video.id}
                video={video}
                voteCount={votes[video.id] || 0}
                rank={rankByVideoId.get(video.id) || 0}
                hasVoted={hasVoted}
                votingPaused={VOTING_PAUSED}
                isLeading={video.id === leadingVideoId && (votes[leadingVideoId] || 0) > 0}
                onVote={(candidate) => {
                  if (VOTING_PAUSED) return;
                  setSelectedVideo(candidate);
                }}
                delay={i * 60}
              />
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-16 w-full border-t border-white/10 pb-20 pt-10 text-center">
          <p className="text-[10px] uppercase tracking-[0.36em] opacity-30">
            PizzaDAO × MusicaW3 · 2026 · CC0 License
          </p>
        </footer>
      </main>

      {/* Vote Modal */}
      <VoteModal
        video={selectedVideo}
        votingPaused={VOTING_PAUSED}
        onClose={() => {
          setSelectedVideo(null);
        }}
        onSuccess={() => {
          setSelectedVideo(null);
        }}
      />
    </div>
  );
}
