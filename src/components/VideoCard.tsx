"use client";

import Image from "next/image";
import { Play } from "lucide-react";
import { Video } from "@/lib/data";

interface VideoCardProps {
  video: Video;
  voteCount: number;
  rank: number;
  hasVoted: boolean;
  isLeading: boolean;
  onVote: (video: Video) => void;
  delay?: number;
}

export function VideoCard({
  video,
  voteCount,
  rank,
  hasVoted,
  isLeading,
  onVote,
  delay = 0,
}: VideoCardProps) {
  return (
    <article
      className="group w-full min-w-0 flex flex-col items-center animate-fade-up opacity-0"
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'forwards' }}
    >
      <div className="relative mb-6 aspect-square w-full overflow-hidden rounded-lg border border-white/10 bg-white/[0.03] transition-colors duration-300 group-hover:border-neon-yellow/40 group-focus-within:border-neon-yellow/60">
        <Image
          src={`https://img.youtube.com/vi/${video.youtubeId}/hqdefault.jpg`}
          alt={video.title}
          width={480}
          height={360}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        />

        <div className="absolute left-0 top-0 p-3">
          <div className="bg-black/75 px-3 py-1 text-[8px] font-black uppercase tracking-widest text-white/70 backdrop-blur-sm">
            #{rank}
          </div>
        </div>

        {isLeading && (
          <div className="absolute top-0 right-0 p-3">
            <div className="bg-neon-yellow text-black text-[8px] font-black px-3 py-1 uppercase tracking-widest shadow-xl">
              Nº 1
            </div>
          </div>
        )}

        <div className="absolute inset-0 flex items-center justify-center bg-black/45 opacity-0 backdrop-blur-[2px] transition-opacity duration-300 group-hover:opacity-100 group-focus-within:opacity-100">
          <a
            href={`https://youtube.com/watch?v=${video.youtubeId}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Escuchar ${video.title} en YouTube`}
            className="flex h-12 w-12 items-center justify-center rounded-full border border-white/60 text-white transition-colors hover:bg-white hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--neon-yellow)]"
          >
            <Play size={20} fill="currentColor" aria-hidden="true" />
          </a>
        </div>
      </div>

      <div className="w-full min-w-0 px-2 text-center">
        <h3 className="mb-2 min-h-[2.5em] text-[10px] font-black uppercase leading-tight tracking-[0.12em] text-white/90 line-clamp-2">
          {video.title}
        </h3>
        <p className="mb-5 min-h-[1.2em] truncate text-[9px] font-medium uppercase tracking-[0.1em] text-white/45">
          {video.artist}
        </p>

        <div className="mb-6 flex items-center justify-center">
          <div className="flex flex-col items-center">
            <span className="vote-counter text-[14px] font-black text-neon-yellow">{voteCount}</span>
            <span className="text-[8px] uppercase tracking-widest text-white/20">Votos</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onVote(video)}
          disabled={hasVoted}
          aria-label={hasVoted ? "Ya registraste un voto" : `Votar por ${video.title}`}
          className={`w-full rounded-lg py-3.5 text-[10px] font-black uppercase tracking-[0.14em] transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--neon-yellow)] focus-visible:ring-offset-2 focus-visible:ring-offset-black
            ${hasVoted
              ? 'cursor-not-allowed border border-white/10 bg-white/[0.02] text-white/25'
              : 'border border-neon-yellow/40 text-neon-yellow hover:bg-neon-yellow hover:text-black'
            }`}
        >
          {hasVoted ? 'Voto registrado' : 'Votar'}
        </button>
      </div>
    </article>
  );
}
