"use client";

import Image from "next/image";
import { useState, useEffect, useMemo } from "react";
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
const PENDING_MAGIC_VOTE_MAX_AGE_MS = 20 * 60 * 1000;

export default function HomePage() {
  const { votes, fetchVotes, userVotedEmail } = useVoteStore();
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [verifiedMagicVideoId, setVerifiedMagicVideoId] = useState<string | null>(null);

  const hasVoted = userVotedEmail !== null;

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
    const emailVerified = url.searchParams.get("email_verified") === "1";
    const voteError = url.searchParams.get("vote_error") === "1";

    if (emailVerified && !VOTING_PAUSED) {
      try {
        const pending = JSON.parse(
          window.localStorage.getItem(PENDING_MAGIC_VOTE_KEY) || "null"
        ) as { videoId?: string; createdAt?: number } | null;
        const isFresh = pending?.createdAt && Date.now() - pending.createdAt < PENDING_MAGIC_VOTE_MAX_AGE_MS;
        const pendingVideo = isFresh
          ? VIDEOS.find((video) => video.id === pending?.videoId)
          : null;

        if (pendingVideo) {
          queueMicrotask(() => {
            setVerifiedMagicVideoId(pendingVideo.id);
            setSelectedVideo(pendingVideo);
          });
        }
      } catch {}
    }

    if (emailVerified || voteError) {
      url.searchParams.delete("email_verified");
      url.searchParams.delete("vote_error");
      window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
    }
  }, [isLoaded]);

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

      <main className="w-full max-w-7xl px-4 py-16 sm:px-6 sm:py-20 flex flex-col items-center relative z-10">

        {/* Concurso principal */}
        <section className="w-full max-w-6xl animate-fade-up">
          <div className="bg-black/68 backdrop-blur-2xl border border-white/10 rounded-lg p-6 text-center shadow-[0_24px_90px_rgba(0,0,0,0.48)] sm:p-8 md:p-12">

            <div className="mb-12 md:mb-14">
              <div className="mb-8 flex items-center justify-center gap-4 sm:gap-6">
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

              <h1 className="mb-6 text-4xl font-black uppercase leading-[0.95] text-white sm:text-5xl md:text-7xl">
                Música y Pizzas <br />
                <span style={{ color: "var(--neon-yellow)" }}>en Español</span>
              </h1>
              <p className="font-mono text-sm font-bold uppercase tracking-[0.32em] text-neon-yellow sm:text-base md:text-lg">
                PizzaDAO x MusicaW3
              </p>
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

            <div className="mb-10 border-y border-neon-yellow/20 bg-white/[0.025] py-8 shadow-[0_0_50px_rgba(255,230,0,0.05)] sm:mb-12 sm:py-10">
              <h3 className="mb-8 text-[11px] font-black uppercase tracking-[0.48em] text-white/60">
                Premios del Concurso
              </h3>
              <div className="grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-10">
                <div className="flex flex-col">
                  <span className="mb-3 text-5xl font-black text-white md:text-6xl">$200</span>
                  <span className="text-[11px] uppercase tracking-[0.4em] text-white/60 font-bold">1er Lugar</span>
                </div>
                <div className="flex flex-col border-y border-neon-yellow/10 py-8 md:border-x md:border-y-0 md:py-0">
                  <span className="mb-3 text-5xl font-black text-white md:text-6xl">$100</span>
                  <span className="text-[11px] uppercase tracking-[0.4em] text-white/60 font-bold">2do Lugar</span>
                </div>
                <div className="flex flex-col">
                  <span className="mb-3 text-5xl font-black text-white md:text-6xl">$50</span>
                  <span className="text-[11px] uppercase tracking-[0.4em] text-white/60 font-bold">3er Lugar</span>
                </div>
              </div>
            </div>

            <div className="w-full border-t border-white/5 pt-8">
              <div className="flex flex-col items-center justify-between gap-8 md:flex-row">

                <div className="flex flex-col items-center md:items-start">
                  <p className="mb-5 text-[11px] font-black uppercase tracking-[0.42em] text-white/60">
                    Auspiciado por
                  </p>
                  <a href="https://metapool.app/" target="_blank" rel="noopener noreferrer" className="group flex items-center hover:scale-105 transition-transform">
                    <Image
                      src="/sponsors/metapool-logo.svg"
                      alt="MetaPool Logo"
                      width={260}
                      height={64}
                      className="h-14 w-auto brightness-110"
                    />
                  </a>
                </div>

                <div id="participantes" className="flex flex-col items-center md:items-end text-center md:text-right">
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
            </div>

          </div>
        </section>

        <div className="h-14 w-full flex-shrink-0 pointer-events-none sm:h-20" />

        {/* Ranking en vivo */}
        <section className="w-full max-w-4xl relative z-10 animate-fade-up" style={{ animationDelay: '200ms' }}>
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
              {sortedVideos.slice(0, 5).map((video, index) => (
                <div
                  key={video.id}
                  className="group flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.03] p-3 transition-colors duration-300 hover:border-neon-yellow/30 hover:bg-white/10 sm:p-4"
                >
                  <div className="flex min-w-0 items-center gap-3 sm:gap-5">
                    <span className={`min-w-9 text-center text-2xl font-black md:text-3xl ${index === 0 ? 'text-neon-yellow drop-shadow-[0_0_10px_rgba(255,230,0,0.5)]' : 'text-white/20'}`}>
                      #{index + 1}
                    </span>
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
                      {votes[video.id] || 0}
                    </span>
                    <span className="text-[8px] uppercase tracking-[0.3em] text-white/30 font-bold">Votos</span>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </section>

        <div className="h-16 w-full flex-shrink-0 pointer-events-none sm:h-24" />

        {/* Participantes */}
        <section className="mb-24 grid w-full grid-cols-2 justify-items-center gap-x-5 gap-y-14 sm:grid-cols-3 sm:gap-x-8 md:grid-cols-4 lg:grid-cols-5 xl:gap-x-12">
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
                setVerifiedMagicVideoId(null);
                setSelectedVideo(candidate);
              }}
              delay={i * 60}
            />
          ))}
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
        verifiedByMagicLink={selectedVideo?.id === verifiedMagicVideoId}
        votingPaused={VOTING_PAUSED}
        onClose={() => {
          setVerifiedMagicVideoId(null);
          setSelectedVideo(null);
        }}
        onSuccess={() => {
          setVerifiedMagicVideoId(null);
          setSelectedVideo(null);
        }}
      />
    </div>
  );
}
