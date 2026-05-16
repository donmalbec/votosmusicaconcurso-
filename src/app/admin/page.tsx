"use client";

import { useEffect, useState } from "react";
import { useVoteStore } from "@/lib/store";
import { Download, Trash2, Mail, ShieldAlert, Lock } from "lucide-react";
import { verifyAdminPassword } from "@/app/actions";

export default function AdminPage() {
  const { voteRecords, deleteVoteRecord, exportCSV, getTotalVotes, fetchVotes } = useVoteStore();
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Evita el error de hidratación en Next.js esperando al cliente
  useEffect(() => {
    setIsLoaded(true);
    fetchVotes();
  }, [fetchVotes]);

  if (!isLoaded) return <div className="min-h-screen bg-black" />;

  // Login Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center p-4">
        <div className="bg-black/60 backdrop-blur-xl w-full max-w-sm p-8 text-center rounded-[40px] border border-neon-yellow/20 shadow-[0_0_80px_rgba(255,230,0,0.1)]">
          <div className="w-16 h-16 rounded-full bg-neon-yellow/10 border border-neon-yellow/30 flex items-center justify-center mx-auto mb-6">
            <Lock size={24} style={{ color: "var(--neon-yellow)" }} />
          </div>
          <h1 className="text-2xl font-black uppercase tracking-tighter mb-2 text-white">Acceso Restringido</h1>
          <p className="text-[10px] uppercase tracking-widest text-white/50 mb-8">Panel de Administración</p>
          
          <form onSubmit={async (e) => {
            e.preventDefault();
            setLoading(true);
            const isValid = await verifyAdminPassword(password);
            setLoading(false);
            
            if (isValid) {
              setIsAuthenticated(true);
            } else {
              setError("Contraseña incorrecta. Acceso denegado.");
              setPassword("");
            }
          }} className="flex flex-col gap-4">
            <input 
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Ingresa la contraseña"
              className="input-neon px-4 py-3 text-center text-xs w-full rounded-full tracking-widest bg-white/5 border border-white/10 text-white focus:outline-none focus:border-neon-yellow"
              required
            />
            {error && <p className="text-[10px] text-red-500 font-bold uppercase tracking-widest">{error}</p>}
            <button 
              type="submit" 
              disabled={loading}
              className="btn-neon py-3 mt-2 text-[11px] font-black w-full rounded-full uppercase tracking-widest"
            >
              {loading ? "Verificando..." : "Desbloquear Panel"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const handleExport = () => {
    const csv = exportCSV();
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pizzadao-votos-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Admin Header */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12 bg-white/5 border border-white/10 rounded-3xl p-8 shadow-2xl">
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tighter text-neon-yellow mb-2">
              Panel de Administración
            </h1>
            <p className="text-sm tracking-widest uppercase text-white/50">
              Base de Datos de Votantes
            </p>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="text-center px-6 border-r border-white/10">
              <span className="block text-4xl font-black text-white">{getTotalVotes()}</span>
              <span className="text-[10px] uppercase tracking-widest text-white/40">Total Votos</span>
            </div>
            <button 
              onClick={handleExport}
              className="flex items-center gap-2 bg-neon-yellow text-black px-6 py-3.5 rounded-full font-black text-xs uppercase tracking-widest hover:scale-105 transition-transform"
            >
              <Download size={14} /> Exportar CSV
            </button>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-black/60 backdrop-blur-md border border-white/10 rounded-[32px] overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/5 text-[10px] uppercase tracking-widest text-white/60 border-b border-white/10">
                <tr>
                  <th className="px-8 py-5 font-black">Correo Electrónico</th>
                  <th className="px-8 py-5 font-black">Voto (Canción)</th>
                  <th className="px-8 py-5 font-black">Fecha y Hora</th>
                  <th className="px-8 py-5 font-black">IP Address</th>
                  <th className="px-8 py-5 font-black text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {voteRecords.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-8 py-20 text-center text-white/30 text-sm tracking-widest uppercase font-bold">
                      🍕 No hay votos registrados todavía
                    </td>
                  </tr>
                ) : (
                  [...voteRecords].reverse().map((record) => (
                    <tr key={record.id} className="hover:bg-white/[0.03] transition-colors group">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                          <Mail size={14} className="text-neon-yellow opacity-50 group-hover:opacity-100 transition-opacity" />
                          <span className="font-bold text-white tracking-wide">{record.email}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <span className="text-[11px] uppercase tracking-widest text-white/80 font-bold bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
                          {record.videoTitle}
                        </span>
                      </td>
                      <td className="px-8 py-5">
                        <span className="text-[11px] text-white/40 font-mono tracking-wider">
                          {new Date(record.timestamp).toLocaleString()}
                        </span>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-2 text-[10px] text-white/30 font-mono tracking-widest bg-black/50 px-2 py-1 rounded w-max border border-white/5">
                          <ShieldAlert size={10} />
                          {record.ip}
                        </div>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <button
                          onClick={() => {
                            if (window.confirm("¿Estás 100% seguro de que quieres anular este voto? Esto descontará 1 voto del ranking en vivo.")) {
                              deleteVoteRecord(record.id);
                            }
                          }}
                          className="text-white/20 hover:text-red-500 p-2 rounded-full hover:bg-red-500/10 transition-colors inline-flex"
                          title="Anular voto"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
