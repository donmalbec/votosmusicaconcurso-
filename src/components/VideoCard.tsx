"use client";

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
  hasVoted,
  isLeading,
  onVote,
  delay = 0,
}: VideoCardProps) {
  return (
    <div 
      className="group w-full flex flex-col items-center animate-fade-up opacity-0"
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'forwards' }}
    >
      {/* Thumbnail Container */}
      <div className="relative w-full aspect-square mb-6 overflow-hidden rounded-sm border border-white/5 group-hover:border-neon-yellow/30 transition-all duration-700">
        <img
          src={`https://img.youtube.com/vi/${video.youtubeId}/hqdefault.jpg`}
          alt={video.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-all duration-1000"
        />
        
        {/* Leading Badge */}
        {isLeading && (
          <div className="absolute top-0 right-0 p-3">
            <div className="bg-neon-yellow text-black text-[8px] font-black px-3 py-1 uppercase tracking-widest shadow-xl">
              Nº 1
            </div>
          </div>
        )}

        {/* Play Overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-black/40 backdrop-blur-[2px]">
          <button 
            onClick={() => window.open(`https://youtube.com/watch?v=${video.youtubeId}`, '_blank')}
            className="w-12 h-12 rounded-full border border-white/50 flex items-center justify-center text-white hover:bg-white hover:text-black transition-all"
          >
            <Play size={20} fill="currentColor" />
          </button>
        </div>
      </div>

      {/* Info - Minimalist */}
      <div className="w-full text-center px-2">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/90 mb-2 truncate">
          {video.title}
        </h3>
        <p className="text-[9px] uppercase tracking-[0.1em] text-white/40 mb-6 font-medium">
          {video.artist}
        </p>
        
        {/* Stats Row - Just Votes */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex flex-col items-center">
            <span className="text-[12px] font-black text-neon-yellow">{voteCount}</span>
            <span className="text-[8px] uppercase tracking-widest text-white/20">Votos</span>
          </div>
        </div>

        {/* Vote Button - Rounded Pill */}
        <button
          onClick={() => onVote(video)}
          disabled={hasVoted}
          className={`w-full py-4 rounded-full text-[9px] font-black uppercase tracking-[0.3em] transition-all duration-500
            ${hasVoted 
              ? 'border border-white/5 text-white/10 cursor-not-allowed' 
              : 'border border-neon-yellow/30 text-neon-yellow hover:bg-neon-yellow hover:text-black shadow-lg hover:shadow-neon-yellow/20'
            }`}
        >
          {hasVoted ? 'VOTADO' : 'VOTAR'}
        </button>
      </div>
    </div>
  );
}
