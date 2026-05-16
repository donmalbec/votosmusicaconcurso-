import { create } from "zustand";
import { persist } from "zustand/middleware";
import { VoteRecord } from "./data";
import { supabase } from "./supabase";

interface VoteState {
  votes: Record<string, number>; // videoId -> count
  voteRecords: VoteRecord[];
  
  // Local persistence for the current browser
  userVotedEmail: string | null; 
  votedVideoIds: string[]; // Array of IDs the user has already voted for
  rateLimitAttempts: Record<string, number[]>; 

  // Async Supabase Actions
  fetchVotes: () => Promise<void>;
  castVote: (email: string, videoId: string, videoTitle: string, artist: string, ip: string, deviceId: string) => Promise<{ success: boolean; error?: string }>;
  deleteVoteRecord: (id: string) => Promise<void>;
  
  getVoteCount: (videoId: string) => number;
  getTotalVotes: () => number;
  getTotalEmails: () => number;
  checkHasVotedForVideo: (videoId: string) => boolean;
  checkRateLimit: (ip: string) => boolean;
  exportCSV: () => string;
}

export const useVoteStore = create<VoteState>()(
  persist(
    (set, get) => ({
      votes: {},
      voteRecords: [],
      userVotedEmail: null,
      votedVideoIds: [],
      rateLimitAttempts: {},

      fetchVotes: async () => {
        const { data, error } = await supabase.from('votes').select('*');
        if (!error && data) {
          const records: VoteRecord[] = data.map((r: any) => ({
            id: r.id,
            email: r.email,
            videoId: r.video_id,
            videoTitle: r.video_title,
            artist: r.artist,
            ip: r.ip_address,
            timestamp: r.created_at,
            deviceId: r.device_id
          }));
          
          const newVotes: Record<string, number> = {};
          records.forEach(r => {
            newVotes[r.videoId] = (newVotes[r.videoId] || 0) + 1;
          });
          
          set({ voteRecords: records, votes: newVotes });
        }
      },

      castVote: async (email, videoId, videoTitle, artist, ip, deviceId) => {
        const state = get();

        // 1. Check local IP rate limit
        if (!state.checkRateLimit(ip)) {
          return { success: false, error: "Demasiados intentos. Por seguridad, espera unos minutos." };
        }

        // 2. Check local voted status for this specific video
        if (state.votedVideoIds.includes(videoId)) {
          return { success: false, error: "Ya has emitido un voto por esta canción." };
        }

        // 3. Insert into Supabase (DB will enforce UNIQUE constraints)
        const { data, error } = await supabase
          .from('votes')
          .insert([{
            email,
            video_id: videoId,
            video_title: videoTitle,
            artist,
            ip_address: ip,
            device_id: deviceId
          }])
          .select();

        if (error) {
          // Handle unique constraint violations from DB
          if (error.code === '23505') {
            if (error.message?.includes('unique_email_video')) {
              return { success: false, error: "Este correo ya votó por esta canción." };
            }
            if (error.message?.includes('unique_device_video')) {
              return { success: false, error: "Este dispositivo ya registró un voto para esta canción." };
            }
            return { success: false, error: "Voto duplicado detectado." };
          }
          return { success: false, error: "Error de conexión con la base de datos." };
        }

        if (data && data[0]) {
          const r = data[0];
          const newRecord: VoteRecord = {
            id: r.id,
            email: r.email,
            videoId: r.video_id,
            videoTitle: r.video_title,
            artist: r.artist,
            ip: r.ip_address,
            timestamp: r.created_at,
            deviceId: r.device_id
          };

          set((s) => {
            const newAttempts = { ...s.rateLimitAttempts };
            const now = Date.now();
            newAttempts[ip] = [...(newAttempts[ip] || []), now];

            return {
              votes: { ...s.votes, [videoId]: (s.votes[videoId] || 0) + 1 },
              voteRecords: [...s.voteRecords, newRecord],
              userVotedEmail: email,
              votedVideoIds: [...s.votedVideoIds, videoId],
              rateLimitAttempts: newAttempts,
            };
          });
        }

        return { success: true };
      },

      deleteVoteRecord: async (id) => {
        const { error } = await supabase.from('votes').delete().eq('id', id);
        if (!error) {
          set((s) => {
            const record = s.voteRecords.find((r) => r.id === id);
            if (!record) return s;
            const newVotes = { ...s.votes };
            newVotes[record.videoId] = Math.max(0, (newVotes[record.videoId] || 1) - 1);
            return {
              voteRecords: s.voteRecords.filter((r) => r.id !== id),
              votes: newVotes,
            };
          });
        }
      },

      getVoteCount: (videoId) => get().votes[videoId] || 0,
      getTotalVotes: () => get().voteRecords.length,
      getTotalEmails: () => new Set(get().voteRecords.map(r => r.email)).size,
      checkHasVotedForVideo: (videoId) => get().votedVideoIds.includes(videoId),

      checkRateLimit: (ip) => {
        const attempts = get().rateLimitAttempts[ip] || [];
        const now = Date.now();
        const windowMs = 5 * 60 * 1000; // 5 mins
        const MAX_ATTEMPTS = 5;
        const recent = attempts.filter((t) => now - t < windowMs);
        return recent.length < MAX_ATTEMPTS;
      },

      exportCSV: () => {
        const records = get().voteRecords;
        const header = "ID,Email,Video,Artista,IP,DeviceID,Fecha";
        const rows = records.map((r) =>
          `"${r.id}","${r.email}","${r.videoTitle}","${r.artist}","${r.ip}","${r.deviceId}","${r.timestamp}"`
        );
        return [header, ...rows].join("\n");
      },
    }),
    {
      name: "pizza-music-security-v1",
      partialize: (state) => ({ 
        userVotedEmail: state.userVotedEmail,
        votedVideoIds: state.votedVideoIds,
        rateLimitAttempts: state.rateLimitAttempts 
      }),
    }
  )
);
