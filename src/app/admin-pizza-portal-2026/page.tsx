"use client";

import { useState } from "react";
import { useVoteStore } from "@/lib/store";
import {
  Shield, Download, Trash2, LogOut, Users, Vote,
  TrendingUp, AlertTriangle, Lock, Eye, EyeOff
} from "lucide-react";
import { VIDEOS } from "@/lib/data";

const ADMIN_PASSWORD = "PizzaDAO2026#Admin!";

export default function AdminPortal() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState("");
  const [filterEmail, setFilterEmail] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const {
    voteRecords, votes, deleteVoteRecord, getTotalVotes, getTotalEmails, exportCSV
  } = useVoteStore();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setAuthenticated(true);
      setAuthError("");
    } else {
      setAuthError("Contraseña incorrecta. Acceso denegado.");
    }
  };

  const handleExportCSV = () => {
    const csv = exportCSV();
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pizzadao-votes-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDelete = (id: string) => {
    if (confirmDelete === id) {
      deleteVoteRecord(id);
      setConfirmDelete(null);
    } else {
      setConfirmDelete(id);
    }
  };

  // Stats per video
  const videoStats = VIDEOS.map((v) => ({
    ...v,
    count: votes[v.id] || 0,
    pct: getTotalVotes() > 0 ? Math.round(((votes[v.id] || 0) / getTotalVotes()) * 100) : 0,
  })).sort((a, b) => b.count - a.count);

  // Filtered records
  const filteredRecords = voteRecords.filter((r) =>
    r.email.toLowerCase().includes(filterEmail.toLowerCase()) ||
    r.videoTitle.toLowerCase().includes(filterEmail.toLowerCase()) ||
    r.ip.includes(filterEmail)
  );

  // IP duplicates detection
  const ipCounts: Record<string, number> = {};
  voteRecords.forEach((r) => { ipCounts[r.ip] = (ipCounts[r.ip] || 0) + 1; });
  const suspiciousIPs = Object.entries(ipCounts).filter(([, c]) => c > 2).map(([ip]) => ip);

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "var(--bg-primary)" }}>
        <div className="glass-card p-8 w-full max-w-sm text-center"
          style={{ border: "1px solid rgba(255,230,0,0.2)", boxShadow: "0 0 60px rgba(255,230,0,0.08)" }}>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
            style={{ background: "rgba(255,230,0,0.1)", border: "1px solid rgba(255,230,0,0.3)" }}>
            <Lock size={26} style={{ color: "var(--neon-yellow)" }} />
          </div>
          <h1 className="text-xl font-bold text-white mb-1">Portal de Administración</h1>
          <p className="text-xs mb-6" style={{ color: "var(--text-muted)" }}>PizzaDAO × MusicaW3 · Acceso Restringido</p>

          <form onSubmit={handleLogin} className="flex flex-col gap-4 text-left">
            <div>
              <label className="text-xs mb-1.5 block" style={{ color: "var(--text-secondary)" }}>Contraseña de Administrador</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="input-neon px-4 py-3 text-sm pr-10"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: "var(--text-muted)" }}
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            {authError && (
              <p className="text-xs" style={{ color: "var(--danger)" }}>{authError}</p>
            )}
            <button type="submit" className="btn-neon py-3 text-sm w-full">
              <Shield size={14} className="inline mr-2" />
              Ingresar
            </button>
          </form>
          <p className="mt-4 text-xs" style={{ color: "var(--text-muted)" }}>🍕 Solo personal autorizado</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-primary)" }}>
      {/* Admin Header */}
      <header className="sticky top-0 z-40" style={{
        background: "rgba(0,0,0,0.9)",
        borderBottom: "1px solid rgba(255,230,0,0.15)",
        backdropFilter: "blur(20px)",
      }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "var(--neon-yellow)" }}>
              <Shield size={15} color="#000" strokeWidth={2.5} />
            </div>
            <div>
              <div className="font-bold text-white text-sm">Admin Dashboard</div>
              <div className="text-xs" style={{ color: "var(--neon-yellow)" }}>PizzaDAO × MusicaW3</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={handleExportCSV} className="btn-ghost text-xs px-3 py-2 flex items-center gap-1.5">
              <Download size={12} />
              Exportar CSV
            </button>
            <button
              onClick={() => setAuthenticated(false)}
              className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg transition-colors"
              style={{ color: "var(--text-muted)" }}
            >
              <LogOut size={12} />
              Salir
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        {/* Metric Cards */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: <Vote size={18} />, label: "Votos Totales", value: getTotalVotes().toLocaleString(), color: "var(--neon-yellow)" },
            { icon: <Users size={18} />, label: "Emails Únicos", value: getTotalEmails().toLocaleString(), color: "#00FF88" },
            { icon: <AlertTriangle size={18} />, label: "IPs Sospechosas", value: suspiciousIPs.length.toString(), color: suspiciousIPs.length > 0 ? "var(--danger)" : "#00FF88" },
            { icon: <TrendingUp size={18} />, label: "Candidatos", value: VIDEOS.length.toString(), color: "#60B4FF" },
          ].map((m) => (
            <div key={m.label} className="glass-card p-5">
              <div className="flex items-center gap-2 mb-3" style={{ color: m.color }}>{m.icon}</div>
              <div className="text-2xl font-bold text-white mb-0.5" style={{ fontFamily: "'Space Mono', monospace" }}>{m.value}</div>
              <div className="text-xs" style={{ color: "var(--text-muted)" }}>{m.label}</div>
            </div>
          ))}
        </section>

        {/* Suspicious IPs */}
        {suspiciousIPs.length > 0 && (
          <section className="rounded-xl p-4 flex items-start gap-3"
            style={{ background: "rgba(255,68,68,0.06)", border: "1px solid rgba(255,68,68,0.25)" }}>
            <AlertTriangle size={16} style={{ color: "var(--danger)" }} className="mt-0.5 shrink-0" />
            <div>
              <div className="text-sm font-semibold mb-1" style={{ color: "#FF8888" }}>IPs con comportamiento sospechoso (más de 2 votos)</div>
              <div className="flex flex-wrap gap-2">
                {suspiciousIPs.map((ip) => (
                  <span key={ip} className="text-xs px-2 py-1 rounded font-mono"
                    style={{ background: "rgba(255,68,68,0.15)", color: "#FF8888" }}>
                    {ip} ({ipCounts[ip]} intentos)
                  </span>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Results by Video */}
        <section>
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <TrendingUp size={18} style={{ color: "var(--neon-yellow)" }} />
            Resultados por Canción
          </h2>
          <div className="space-y-3">
            {videoStats.map((v, i) => (
              <div key={v.id} className="glass-card p-4">
                <div className="flex items-center gap-4">
                  <div className="text-xl font-bold shrink-0" style={{
                    color: i === 0 ? "var(--neon-yellow)" : i === 1 ? "#C0C0C0" : i === 2 ? "#CD7F32" : "var(--text-muted)",
                    fontFamily: "'Space Mono', monospace",
                    width: "32px"
                  }}>#{i + 1}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div>
                        <span className="font-semibold text-white text-sm">{v.title}</span>
                        <span className="text-xs ml-2" style={{ color: "var(--text-muted)" }}>{v.artist}</span>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-bold" style={{ color: "var(--neon-yellow)", fontFamily: "'Space Mono', monospace" }}>
                          {v.count}
                        </div>
                        <div className="text-xs" style={{ color: "var(--text-muted)" }}>{v.pct}%</div>
                      </div>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                      <div
                        className="h-full rounded-full transition-all duration-1000"
                        style={{
                          width: `${v.pct}%`,
                          background: i === 0
                            ? "var(--neon-yellow)"
                            : i === 1 ? "#C0C0C0"
                            : i === 2 ? "#CD7F32"
                            : "rgba(255,230,0,0.3)"
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Vote Audit Table */}
        <section>
          <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Shield size={18} style={{ color: "var(--neon-yellow)" }} />
              Auditoría de Votos
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(255,230,0,0.1)", color: "var(--neon-yellow)" }}>
                {filteredRecords.length}
              </span>
            </h2>
            <input
              type="text"
              value={filterEmail}
              onChange={(e) => setFilterEmail(e.target.value)}
              placeholder="Filtrar por email, video o IP..."
              className="input-neon px-3 py-2 text-xs"
              style={{ maxWidth: "280px" }}
            />
          </div>

          <div className="overflow-x-auto rounded-xl" style={{ border: "1px solid var(--border-subtle)" }}>
            <table className="w-full text-xs">
              <thead>
                <tr style={{ background: "rgba(255,230,0,0.05)", borderBottom: "1px solid var(--border-subtle)" }}>
                  {["Email", "Video Votado", "Artista", "IP", "Fecha/Hora", "Acción"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 font-semibold uppercase tracking-wider"
                      style={{ color: "var(--text-muted)" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10" style={{ color: "var(--text-muted)" }}>
                      No hay votos registrados aún
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((record) => {
                    const isSuspicious = suspiciousIPs.includes(record.ip);
                    return (
                      <tr
                        key={record.id}
                        style={{
                          borderBottom: "1px solid rgba(255,255,255,0.04)",
                          background: isSuspicious ? "rgba(255,68,68,0.04)" : undefined,
                        }}
                      >
                        <td className="px-4 py-3 font-mono" style={{ color: "var(--text-secondary)" }}>
                          {record.email}
                          {isSuspicious && <span className="ml-2 text-xs" style={{ color: "var(--danger)" }}>⚠</span>}
                        </td>
                        <td className="px-4 py-3 text-white font-medium">{record.videoTitle}</td>
                        <td className="px-4 py-3" style={{ color: "var(--text-secondary)" }}>{record.artist}</td>
                        <td className="px-4 py-3 font-mono" style={{ color: isSuspicious ? "#FF8888" : "var(--text-muted)" }}>
                          {record.ip}
                        </td>
                        <td className="px-4 py-3" style={{ color: "var(--text-muted)" }}>
                          {new Date(record.timestamp).toLocaleString("es-CL")}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleDelete(record.id)}
                            className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-all"
                            style={{
                              background: confirmDelete === record.id ? "rgba(255,68,68,0.2)" : "rgba(255,68,68,0.08)",
                              color: "var(--danger)",
                              border: "1px solid rgba(255,68,68,0.2)",
                            }}
                          >
                            <Trash2 size={10} />
                            {confirmDelete === record.id ? "¿Confirmar?" : "Eliminar"}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
