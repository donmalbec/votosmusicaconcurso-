import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  castVote as castVoteAction,
  deleteVoteRecord as deleteVoteRecordAction,
  fetchAdminVoteRecords,
  fetchPublicVoteCounts,
} from "@/app/actions";
import { type VoteRecord } from "./data";

interface VoteState {
  votes: Record<string, number>;
  voteRecords: VoteRecord[];

  // Local persistence only improves UX; the server and database enforce the rules.
  userVotedEmail: string | null;
  votedVideoIds: string[];

  fetchVotes: () => Promise<void>;
  fetchAdminVotes: () => Promise<{ success: boolean; error?: string }>;
  castVote: (
    email: string,
    videoId: string,
    deviceFingerprint: string,
    website?: string
  ) => Promise<{ success: boolean; error?: string }>;
  deleteVoteRecord: (id: string) => Promise<{ success: boolean; error?: string }>;

  getVoteCount: (videoId: string) => number;
  getTotalVotes: () => number;
  getTotalEmails: () => number;
  checkHasVotedForVideo: (videoId: string) => boolean;
  exportCSV: () => string;
}

function escapeCsvCell(value: string) {
  const safeValue = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return `"${safeValue.replace(/"/g, '""')}"`;
}

export const useVoteStore = create<VoteState>()(
  persist(
    (set, get) => ({
      votes: {},
      voteRecords: [],
      userVotedEmail: null,
      votedVideoIds: [],

      fetchVotes: async () => {
        const result = await fetchPublicVoteCounts();
        if (result.success) {
          set({ votes: result.counts, voteRecords: [] });
        }
      },

      fetchAdminVotes: async () => {
        const result = await fetchAdminVoteRecords();
        if (!result.success) {
          return { success: false, error: result.error };
        }

        set({ voteRecords: result.records, votes: result.counts });
        return { success: true };
      },

      castVote: async (email, videoId, deviceFingerprint, website) => {
        const state = get();

        if (state.userVotedEmail) {
          return { success: false, error: "Ya registraste un voto en este navegador." };
        }

        const result = await castVoteAction({
          email,
          videoId,
          deviceFingerprint,
          website,
        });

        if (!result.success) {
          return { success: false, error: result.error };
        }

        set((s) => ({
          votes: result.counts,
          userVotedEmail: result.email,
          votedVideoIds: Array.from(new Set([...s.votedVideoIds, result.videoId])),
        }));

        return { success: true };
      },

      deleteVoteRecord: async (id) => {
        const result = await deleteVoteRecordAction(id);
        if (!result.success) {
          return { success: false, error: result.error };
        }

        set((s) => ({
          voteRecords: s.voteRecords.filter((record) => record.id !== id),
          votes: result.counts,
        }));

        return { success: true };
      },

      getVoteCount: (videoId) => get().votes[videoId] || 0,
      getTotalVotes: () => get().voteRecords.length || Object.values(get().votes).reduce((total, count) => total + count, 0),
      getTotalEmails: () => new Set(get().voteRecords.map((record) => record.email)).size,
      checkHasVotedForVideo: (videoId) => get().votedVideoIds.includes(videoId),

      exportCSV: () => {
        const records = get().voteRecords;
        const header = ["ID", "Email", "Video", "Artista", "IP", "DeviceID", "Fecha"].map(escapeCsvCell);
        const rows = records.map((record) =>
          [
            record.id,
            record.email,
            record.videoTitle,
            record.artist,
            record.ip,
            record.deviceId,
            record.timestamp,
          ].map(escapeCsvCell)
        );

        return [header, ...rows].map((row) => row.join(",")).join("\n");
      },
    }),
    {
      name: "pizza-music-security-v2",
      partialize: (state) => ({
        userVotedEmail: state.userVotedEmail,
        votedVideoIds: state.votedVideoIds,
      }),
    }
  )
);
