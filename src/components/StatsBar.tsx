"use client";

import { useVoteStore } from "@/lib/store";
import { VIDEOS } from "@/lib/data";

export function StatsBar() {
  const { getTotalVotes, getTotalEmails, votes } = useVoteStore();

  const sortedVideos = [...VIDEOS].sort(
    (a, b) => (votes[b.id] || 0) - (votes[a.id] || 0)
  );
  const leader = sortedVideos[0];
  const leaderVotes = votes[leader?.id] || 0;

  return (
    <div
      className="rounded-full px-12 py-8 flex flex-wrap gap-16 justify-center items-center text-center"
      style={{
        background: "rgba(255,230,0,0.02)",
        border: "1px solid rgba(255,230,0,0.1)",
      }}
    >
      <StatItem label="Total de Votos" value={getTotalVotes().toLocaleString()} icon="🗳️" />
      <StatItem label="Participantes" value={getTotalEmails().toLocaleString()} icon="👥" />
      <StatItem label="Concursantes" value={VIDEOS.length.toString()} icon="🎵" />
      {leaderVotes > 0 && (
        <StatItem
          label="Va Ganando"
          value={leader.title}
          sub={`${leaderVotes} votos`}
          icon="🏆"
        />
      )}
    </div>
  );
}

function StatItem({ label, value, sub, icon }: { label: string; value: string; sub?: string; icon: string }) {
  return (
    <div className="flex items-center gap-3 min-w-[120px]">
      <span className="text-2xl">{icon}</span>
      <div>
        <div className="text-xs" style={{ color: "var(--text-muted)" }}>{label}</div>
        <div className="font-bold text-white text-sm leading-tight">{value}</div>
        {sub && <div className="text-xs" style={{ color: "var(--neon-yellow)" }}>{sub}</div>}
      </div>
    </div>
  );
}
