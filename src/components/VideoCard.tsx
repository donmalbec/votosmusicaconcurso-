"use client";

import Image from "next/image";
import { ChevronRight, Pizza, Play } from "lucide-react";
import { Video } from "@/lib/data";

interface VideoCardProps {
  video: Video;
  voteCount: number;
  rank: number;
  hasVoted: boolean;
  votingPaused: boolean;
  isLeading: boolean;
  onVote: (video: Video) => void;
  delay?: number;
}

export function VideoCard({
  video,
  voteCount,
  rank,
  hasVoted,
  votingPaused,
  isLeading,
  onVote,
  delay = 0,
}: VideoCardProps) {
  const voteDisabled = hasVoted || votingPaused;
  const voteLabel = votingPaused ? "Votación pausada" : hasVoted ? "Voto registrado" : "Votar";
  const voteAriaLabel = votingPaused
    ? "La votación está pausada por mantenimiento"
    : hasVoted
      ? "Ya registraste un voto"
      : `Votar por ${video.title}`;

  const isTop3 = rank >= 1 && rank <= 3;
  const isTop10 = rank >= 1 && rank <= 10;
  const rankBadgeClass = isTop3
    ? "border-transparent bg-neon-yellow text-black"
    : isTop10
      ? "border-neon-yellow/40 bg-black/85 text-neon-yellow"
      : "border-white/10 bg-black/80 text-white/70";
  const rankSizeClass = isTop3
    ? "px-2.5 py-1 text-[11px]"
    : isTop10
      ? "px-2.5 py-1 text-[10px]"
      : "px-2 py-0.5 text-[8px]";

  return (
    <article
      className="group flex w-full min-w-0 flex-col items-center rounded-xl opacity-0 animate-fade-up focus-within:[outline:2px_solid_var(--neon-yellow)] focus-within:[outline-offset:4px]"
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'forwards' }}
    >
      <div className={`relative mb-4 aspect-square w-full overflow-hidden rounded-lg border bg-white/[0.03] shadow-[0_18px_46px_rgba(0,0,0,0.35)] transition-colors duration-300 group-hover:border-neon-yellow/45 group-focus-within:border-neon-yellow/60 ${isLeading ? "border-neon-yellow/45" : "border-white/10"}`}>
        <Image
          src={`https://img.youtube.com/vi/${video.youtubeId}/hqdefault.jpg`}
          alt={video.title}
          width={480}
          height={360}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        />

        <div className="absolute left-0 top-0 p-2.5 sm:p-3">
          <div className={`flex items-center rounded-md border font-black uppercase tracking-widest backdrop-blur-sm ${rankBadgeClass} ${rankSizeClass}`}>
            {isTop3 && <Pizza size={11} aria-hidden="true" className="mr-1 -ml-0.5" />}
            #{rank}
          </div>
        </div>

        {isLeading && (
          <div className="absolute top-0 right-0 p-2.5 sm:p-3">
            <div className="rounded-md bg-neon-yellow px-2.5 py-1 text-[8px] font-black uppercase tracking-widest text-black shadow-xl">
              Nº 1
            </div>
          </div>
        )}

        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/75 to-transparent" />

        <div className="absolute inset-0 flex items-center justify-center bg-black/35 opacity-100 backdrop-blur-[1px] transition-opacity duration-300 sm:opacity-0 group-hover:opacity-100 group-focus-within:opacity-100">
          <a
            href={`https://youtube.com/watch?v=${video.youtubeId}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Escuchar ${video.title} en YouTube`}
            className="flex h-12 w-12 items-center justify-center rounded-full border border-white/60 bg-black/55 text-white shadow-[0_0_24px_rgba(0,0,0,0.45)] backdrop-blur-sm transition-colors hover:bg-neon-yellow hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--neon-yellow)]"
          >
            <Play size={20} fill="currentColor" aria-hidden="true" />
          </a>
        </div>
      </div>

      <div className="w-full min-w-0 px-2 text-center">
        <h3 className="mb-2 min-h-[2.5em] text-[11px] font-black uppercase leading-tight tracking-[0.1em] text-white line-clamp-2 sm:text-[12px]">
          {video.title}
        </h3>
        <p className="mb-4 min-h-[1.2em] truncate text-[9px] font-medium uppercase tracking-[0.1em] text-white/45">
          {video.artist}
        </p>

        <div className="mb-4 flex items-center justify-center">
          <div className="flex min-w-20 flex-col items-center rounded-lg border border-white/10 bg-white/[0.025] px-4 py-2">
            <span className="vote-counter text-[15px] font-black leading-none text-neon-yellow">{voteCount}</span>
            <span className="mt-1 text-[8px] uppercase tracking-widest text-white/30">Votos</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onVote(video)}
          disabled={voteDisabled}
          aria-label={voteAriaLabel}
          className={`flex h-11 w-full items-center justify-center gap-1.5 rounded-lg text-[10px] font-black uppercase tracking-[0.14em] transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--neon-yellow)] focus-visible:ring-offset-2 focus-visible:ring-offset-black
            ${voteDisabled
              ? 'cursor-not-allowed border border-white/10 bg-white/[0.02] text-white/25'
              : 'border border-neon-yellow/60 bg-neon-yellow/10 text-neon-yellow hover:border-neon-yellow hover:bg-neon-yellow hover:text-black focus-visible:border-neon-yellow focus-visible:bg-neon-yellow focus-visible:text-black'
            }`}
        >
          {voteLabel}
          {!voteDisabled && (
            <ChevronRight
              size={13}
              aria-hidden="true"
              className="transition-transform duration-300 group-hover:translate-x-0.5"
            />
          )}
        </button>
      </div>
    </article>
  );
}
