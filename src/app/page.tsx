"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { VideoCard } from "@/components/VideoCard";
import { VoteModal } from "@/components/VoteModal";
import { VIDEOS, type Video } from "@/lib/data";
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

    if (emailVerified) {
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

  if (!isLoaded) return <div className="min-h-screen bg-black" />;

  // Dynamic Sorting: Always prioritize votes to create a live leaderboard effect
  const sortedVideos = [...VIDEOS].sort((a, b) => {
    const votesA = votes[a.id] || 0;
    const votesB = votes[b.id] || 0;
    
    // Sort by votes (highest first)
    if (votesB !== votesA) {
      return votesB - votesA;
    }
    
    // Fallback: If votes are tied, maintain original array order
    return 0;
  });

  const getRank = (id: string) => {
    const sorted = [...VIDEOS].sort((a, b) => (votes[b.id] || 0) - (votes[a.id] || 0));
    return sorted.findIndex((v) => v.id === id) + 1;
  };

  const leadingVideoId = [...VIDEOS].sort((a, b) => (votes[b.id] || 0) - (votes[a.id] || 0))[0]?.id;

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
          className="w-full h-full object-contain opacity-80 brightness-110 saturate-110"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/90" />
      </div>
      
      <Header />

      <main className="w-full max-w-7xl px-6 py-20 flex flex-col items-center relative z-10">
        
        {/* MONUMENTAL HERO CARD: Combining all key info */}
        <section className="w-full max-w-5xl animate-fade-up">
          <div className="bg-black/60 backdrop-blur-2xl border border-white/10 rounded-[60px] p-12 md:p-24 text-center shadow-[0_0_100px_rgba(0,0,0,0.5)]">
            
            {/* 1. Header Info (Logos + Title) */}
            <div className="mb-20">
              {/* Logos de Alianza Centrados */}
              <div className="flex items-center justify-center gap-6 mb-12">
                {/* PizzaDAO Logo Cropped (Only Symbol) - Adjusted width to not cut the ring */}
                <div className="w-[76px] h-16 md:w-[96px] md:h-20 overflow-hidden relative flex items-center justify-start">
                  <img 
                    src="https://globalpizza.party/assets/pizzadao-logo-DYYagcIv.png" 
                    alt="PizzaDAO" 
                    className="absolute left-0 h-full w-auto max-w-none"
                  />
                </div>
                
                <span className="text-2xl font-black text-white/40">×</span>
                
                {/* MusicaW3 Logo */}
                <img 
                  src="https://www.musicaw3.com/logo-mw3.png" 
                  alt="MusicaW3" 
                  className="h-16 md:h-20 w-auto object-contain"
                />
              </div>
              
              <h1 className="text-5xl md:text-8xl font-black text-white mb-8 tracking-tighter leading-none uppercase">
                Música y Pizzas <br />
                <span style={{ color: "var(--neon-yellow)" }}>en Español</span>
              </h1>
              <p className="text-xl md:text-2xl font-bold tracking-[0.4em] uppercase text-neon-yellow font-mono">
                PizzaDAO x MusicaW3
              </p>
            </div>

            {/* 2. Prizes Block - Added glowing borders */}
            <div className="mb-32 py-24 border-y border-neon-yellow/20 shadow-[0_0_50px_rgba(255,230,0,0.05)] bg-white/[0.02]">
              <h3 className="text-[11px] tracking-[0.8em] uppercase text-white/60 mb-20 font-black">
                Premios del Concurso
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-20">
                <div className="flex flex-col">
                  <span className="text-7xl font-black text-white mb-4">$200</span>
                  <span className="text-[11px] uppercase tracking-[0.4em] text-white/60 font-bold">1er Lugar</span>
                </div>
                <div className="flex flex-col border-y md:border-y-0 md:border-x border-neon-yellow/10 py-16 md:py-0">
                  <span className="text-7xl font-black text-white mb-4">$100</span>
                  <span className="text-[11px] uppercase tracking-[0.4em] text-white/60 font-bold">2do Lugar</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-7xl font-black text-white mb-4">$50</span>
                  <span className="text-[11px] uppercase tracking-[0.4em] text-white/60 font-bold">3er Lugar</span>
                </div>
              </div>
            </div>

            {/* 3. Sponsorship & Final CTA - Horizontal Balance */}
            <div className="w-full pt-12 border-t border-white/5">
              <div className="flex flex-col md:flex-row justify-between items-center gap-12">
                
                {/* Sponsor Left */}
                <div className="flex flex-col items-center md:items-start">
                  <p className="text-[11px] uppercase tracking-[0.6em] text-white/60 mb-8 font-black">
                    Auspiciado por
                  </p>
                  <a href="https://metapool.app/" target="_blank" rel="noopener noreferrer" className="group flex items-center hover:scale-105 transition-transform">
                    <img 
                      src="/sponsors/metapool-logo.svg" 
                      alt="MetaPool Logo" 
                      className="h-14 w-auto brightness-110"
                    />
                  </a>
                </div>

                {/* CTA Right */}
                <div id="participantes" className="flex flex-col items-center md:items-end text-center md:text-right">
                  <h2 className="text-2xl md:text-5xl font-black text-white mb-4 uppercase tracking-tighter leading-none">
                    Vota por el <span style={{ color: "var(--neon-yellow)" }}>Ganador</span>
                  </h2>
                  <p className="text-[11px] tracking-[0.8em] uppercase opacity-30">Selecciona tu canción favorita abajo</p>
                </div>

              </div>
            </div>

          </div>
        </section>

        {/* PHYSICAL SPACER 1: Hero to Leaderboard */}
        <div className="h-32 w-full flex-shrink-0 pointer-events-none" />

        {/* LIVE LEADERBOARD DASHBOARD */}
        <section className="w-full max-w-4xl relative z-10 animate-fade-up" style={{ animationDelay: '200ms' }}>
          <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-[40px] p-6 md:p-10 shadow-[0_0_80px_rgba(0,0,0,0.8)]">
            
            {/* Dashboard Header */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8 border-b border-white/5 pb-6">
              <h3 className="text-sm md:text-xl font-black uppercase tracking-widest text-white flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
                Ranking en Vivo
              </h3>
              <span className="text-[10px] font-bold tracking-[0.4em] uppercase text-neon-yellow bg-neon-yellow/10 px-4 py-1.5 rounded-full border border-neon-yellow/20">
                Top 5 Tendencias
              </span>
            </div>
            
            {/* Dynamic Rows */}
            <div className="flex flex-col gap-3 relative">
              {sortedVideos.slice(0, 5).map((video, index) => (
                <div 
                  key={video.id} 
                  className="group flex items-center justify-between bg-white/[0.03] rounded-2xl p-4 transition-all duration-500 hover:bg-white/10 border border-white/5 hover:border-neon-yellow/30 hover:scale-[1.02]"
                >
                  <div className="flex items-center gap-6">
                    <span className={`text-2xl md:text-3xl font-black min-w-[40px] text-center ${index === 0 ? 'text-neon-yellow drop-shadow-[0_0_10px_rgba(255,230,0,0.5)]' : 'text-white/20'}`}>
                      #{index + 1}
                    </span>
                    <div className="flex items-center gap-4">
                      {/* Mini Thumbnail */}
                      <img 
                        src={`https://img.youtube.com/vi/${video.youtubeId}/hqdefault.jpg`}
                        alt={video.title}
                        className="w-12 h-12 rounded-lg object-cover border border-white/10 grayscale-[50%] group-hover:grayscale-0 transition-all"
                      />
                      <div className="flex flex-col justify-center">
                        <h4 className="text-[11px] md:text-xs font-black uppercase tracking-widest text-white mb-1">{video.title}</h4>
                        <p className="text-[9px] uppercase tracking-[0.2em] text-white/40">{video.artist}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Votes Counter */}
                  <div className="flex flex-col items-end justify-center">
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

        {/* PHYSICAL SPACER 2: Leaderboard to Grid */}
        <div className="h-32 w-full flex-shrink-0 pointer-events-none" />
          
        {/* SECTION 4: Elegant Grid */}
        <section className="w-full grid grid-cols-2 md:grid-cols-5 gap-x-16 gap-y-32 justify-items-center mb-32">
          {sortedVideos.map((video, i) => (
            <VideoCard
              key={video.id}
              video={video}
              voteCount={votes[video.id] || 0}
              rank={getRank(video.id)}
              hasVoted={hasVoted}
              isLeading={video.id === leadingVideoId && (votes[leadingVideoId] || 0) > 0}
              onVote={(candidate) => {
                setVerifiedMagicVideoId(null);
                setSelectedVideo(candidate);
              }}
              delay={i * 60}
            />
          ))}
        </section>

        {/* Footer */}
        <footer className="w-full mt-24 pt-12 pb-24 border-t border-white/10 text-center">
          <p className="text-[10px] tracking-[0.5em] uppercase opacity-30">
            PizzaDAO × MusicaW3 · 2026 · CC0 License
          </p>
        </footer>
      </main>

      {/* Vote Modal */}
      <VoteModal
        video={selectedVideo}
        verifiedByMagicLink={selectedVideo?.id === verifiedMagicVideoId}
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
