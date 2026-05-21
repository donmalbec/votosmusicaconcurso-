import Image from "next/image";
import { Pizza } from "lucide-react";
import { Header } from "@/components/Header";
import { HomeClient } from "@/components/HomeClient";
import { VIDEOS } from "@/lib/data";
import {
  VOTING_PAUSED,
  VOTING_PAUSED_MESSAGE,
  VOTING_PAUSED_TITLE,
} from "@/lib/maintenance";

function MaintenanceHomePage() {
  const topVideos = VIDEOS.slice(0, 5);

  return (
    <div className="min-h-screen flex flex-col items-center relative" style={{ background: "#000" }}>
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

      <main className="below-fixed-header w-full max-w-7xl px-4 py-16 sm:px-6 sm:py-20 flex flex-col items-center relative z-10">
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
                    priority
                  />
                </div>

                <span className="text-2xl font-black text-white/40">×</span>

                <Image
                  src="https://www.musicaw3.com/logo-mw3.png"
                  alt="MusicaW3"
                  width={128}
                  height={80}
                  className="h-16 md:h-20 w-auto object-contain"
                  priority
                />
              </div>

              <div className="relative mx-auto mb-6 max-w-5xl">
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-0 -inset-y-4"
                  style={{ background: "radial-gradient(ellipse at center, rgba(0,0,0,0.55), transparent 70%)" }}
                />
                <h1 className="relative text-[clamp(2rem,8vw,4.5rem)] font-black uppercase leading-[0.95] text-white">
                  Música y Pizzas <br />
                  <span style={{ color: "var(--neon-yellow)" }}>en Español</span>
                </h1>
              </div>
              <p className="font-mono text-sm font-bold uppercase tracking-[0.32em] text-neon-yellow sm:text-base md:text-lg">
                PizzaDAO x MusicaW3
              </p>
            </div>

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

            <div className="mb-10 border-y border-neon-yellow/20 bg-white/[0.025] py-8 shadow-[0_0_50px_rgba(255,230,0,0.05)] sm:mb-12 sm:py-10">
              <h2 className="mb-8 px-2 text-[10px] font-black uppercase tracking-[0.28em] text-white/60 sm:text-[11px] sm:tracking-[0.4em]">
                Premios del Concurso
              </h2>
              <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden min-[480px]:grid min-[480px]:snap-none min-[480px]:grid-cols-3 min-[480px]:gap-6 min-[480px]:overflow-visible min-[480px]:px-0 min-[480px]:pb-0 md:gap-10">
                <div className="flex min-w-[62%] shrink-0 snap-center flex-col min-[480px]:min-w-0">
                  <span className="mb-2 text-3xl font-black text-white sm:text-5xl md:text-6xl">$200</span>
                  <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-white/70 sm:text-sm sm:tracking-[0.18em]">1er Lugar</span>
                </div>
                <div className="flex min-w-[62%] shrink-0 snap-center flex-col border-neon-yellow/10 min-[480px]:min-w-0 min-[480px]:border-x min-[480px]:px-2">
                  <span className="mb-2 text-3xl font-black text-white sm:text-5xl md:text-6xl">$100</span>
                  <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-white/70 sm:text-sm sm:tracking-[0.18em]">2do Lugar</span>
                </div>
                <div className="flex min-w-[62%] shrink-0 snap-center flex-col min-[480px]:min-w-0">
                  <span className="mb-2 text-3xl font-black text-white sm:text-5xl md:text-6xl">$50</span>
                  <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-white/70 sm:text-sm sm:tracking-[0.18em]">3er Lugar</span>
                </div>
              </div>
            </div>

            {/* Sponsor — its own slim row below the prize block */}
            <div className="mt-8 flex flex-col items-center gap-4 border-t border-white/5 pt-7">
              <p className="text-[10px] font-black uppercase tracking-[0.42em] text-white/50">
                Auspiciado por
              </p>
              <a href="https://metapool.app/" target="_blank" rel="noopener noreferrer" className="group flex items-center rounded-md transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--neon-yellow)] focus-visible:ring-offset-4 focus-visible:ring-offset-black">
                <Image
                  src="/sponsors/metapool-logo.svg"
                  alt="MetaPool Logo"
                  width={260}
                  height={64}
                  className="h-14 w-auto brightness-110"
                  priority
                  unoptimized
                />
              </a>
            </div>

            <div id="participantes" className="mt-9 text-center">
              <h2 className="mb-3 text-2xl font-black uppercase leading-none text-white md:text-4xl">
                Votación <span style={{ color: "var(--neon-yellow)" }}>Pausada</span>
              </h2>
              <p className="text-[11px] uppercase tracking-[0.42em] opacity-40">
                Votos en pausa por mantenimiento
              </p>
            </div>
          </div>
        </section>

        <div className="h-14 w-full flex-shrink-0 pointer-events-none sm:h-20" />

        <section className="w-full max-w-4xl relative z-10 animate-fade-up" style={{ animationDelay: "200ms" }}>
          <div className="bg-black/68 backdrop-blur-xl border border-white/10 rounded-lg p-4 shadow-[0_24px_80px_rgba(0,0,0,0.55)] sm:p-6 md:p-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8 border-b border-white/5 pb-6">
              <h2 className="text-sm md:text-xl font-black uppercase tracking-widest text-white flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
                Ranking en Vivo
              </h2>
              <span className="rounded-lg border border-neon-yellow/20 bg-neon-yellow/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.28em] text-neon-yellow sm:px-4">
                Top 5 Tendencias
              </span>
            </div>

            <div className="flex flex-col gap-3 relative">
              {topVideos.map((video, index) => {
                const isPodium = index < 3;
                const medal = ["🥇", "🥈", "🥉"][index];
                return (
                  <div
                    key={video.id}
                    className={`group rounded-lg border transition-colors duration-300 hover:border-neon-yellow/30 hover:bg-white/10 ${
                      isPodium
                        ? "border-neon-yellow/20 bg-neon-yellow/[0.04] p-4 sm:p-5"
                        : "border-white/5 bg-white/[0.03] p-3 sm:p-4"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3 sm:gap-5">
                        <div className="flex min-w-9 flex-col items-center justify-center sm:min-w-11">
                          {isPodium ? (
                            <>
                              <span className="text-2xl leading-none md:text-3xl" aria-hidden="true">{medal}</span>
                              <span className="mt-0.5 text-[9px] font-black text-white/40">#{index + 1}</span>
                            </>
                          ) : (
                            <span className="text-xl font-black text-white/20 md:text-2xl">#{index + 1}</span>
                          )}
                        </div>
                        <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                          <Image
                            src={`https://img.youtube.com/vi/${video.youtubeId}/hqdefault.jpg`}
                            alt={video.title}
                            width={96}
                            height={96}
                            className="w-12 h-12 rounded-lg object-cover border border-white/10 grayscale-[50%] transition duration-300 group-hover:grayscale-0"
                          />
                          <div className="flex min-w-0 flex-col justify-center">
                            <h3 className="mb-1 truncate text-[11px] font-black uppercase tracking-[0.12em] text-white md:text-xs">{video.title}</h3>
                            <p className="truncate text-[9px] uppercase tracking-[0.12em] text-white/40">{video.artist}</p>
                          </div>
                        </div>
                      </div>

                      <div className="ml-3 flex shrink-0 flex-col items-end justify-center">
                        <span className="text-xl md:text-2xl font-black text-white group-hover:text-neon-yellow transition-colors leading-none mb-1">
                          0
                        </span>
                        <span className="text-[8px] uppercase tracking-[0.3em] text-white/30 font-bold">Votos</span>
                      </div>
                    </div>

                    <div aria-hidden="true" className="mt-3 h-1 w-full overflow-hidden rounded-full bg-white/5">
                      <div className="h-full rounded-full bg-neon-yellow" style={{ width: "0%" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <div className="h-16 w-full flex-shrink-0 pointer-events-none sm:h-24" />

        <section className="mb-24 grid w-full grid-cols-2 justify-items-center gap-x-5 gap-y-14 sm:grid-cols-3 sm:gap-x-8 md:grid-cols-4 lg:grid-cols-5 xl:gap-x-12">
          {VIDEOS.map((video, index) => (
            <article
              key={video.id}
              className="group w-full min-w-0 flex flex-col items-center animate-fade-up opacity-0"
              style={{ animationDelay: `${index * 60}ms`, animationFillMode: "forwards" }}
            >
              <div className="relative mb-6 aspect-square w-full overflow-hidden rounded-lg border border-white/10 bg-white/[0.03] transition-colors duration-300 group-hover:border-neon-yellow/40">
                <Image
                  src={`https://img.youtube.com/vi/${video.youtubeId}/hqdefault.jpg`}
                  alt={video.title}
                  width={480}
                  height={360}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute left-0 top-0 p-2.5 sm:p-3">
                  <div
                    className={`flex items-center rounded-md border font-black uppercase tracking-widest backdrop-blur-sm ${
                      index < 3
                        ? "border-transparent bg-neon-yellow px-2.5 py-1 text-[11px] text-black"
                        : index < 10
                          ? "border-neon-yellow/40 bg-black/85 px-2.5 py-1 text-[10px] text-neon-yellow"
                          : "border-white/10 bg-black/80 px-2 py-0.5 text-[8px] text-white/70"
                    }`}
                  >
                    {index < 3 && <Pizza size={11} aria-hidden="true" className="mr-1 -ml-0.5" />}
                    #{index + 1}
                  </div>
                </div>
              </div>

              <div className="w-full min-w-0 px-2 text-center">
                <h3 className="mb-2 min-h-[2.5em] text-[11px] font-black uppercase leading-tight tracking-[0.12em] text-white line-clamp-2 sm:text-[12px]">
                  {video.title}
                </h3>
                <p className="mb-4 min-h-[1.2em] truncate text-[9px] font-medium uppercase tracking-[0.1em] text-white/45">
                  {video.artist}
                </p>
                <div className="mb-4 flex items-center justify-center">
                  <div className="flex min-w-20 flex-col items-center rounded-lg border border-white/10 bg-white/[0.025] px-4 py-2">
                    <span className="vote-counter text-[15px] font-black leading-none text-neon-yellow">0</span>
                    <span className="mt-1 text-[8px] uppercase tracking-widest text-white/30">Votos</span>
                  </div>
                </div>
                <button
                  type="button"
                  disabled
                  aria-label="La votación está pausada por mantenimiento"
                  className="w-full cursor-not-allowed rounded-lg border border-white/10 bg-white/[0.02] py-3.5 text-[10px] font-black uppercase tracking-[0.14em] text-white/25"
                >
                  Votación pausada
                </button>
              </div>
            </article>
          ))}
        </section>

        <footer className="mt-16 w-full border-t border-white/10 pb-20 pt-10">
          <nav
            aria-label="Enlaces del pie"
            className="mb-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white/50"
          >
            <a href="https://globalpizza.party/" target="_blank" rel="noopener noreferrer" className="rounded transition-colors hover:text-neon-yellow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--neon-yellow)] focus-visible:ring-offset-2 focus-visible:ring-offset-black">
              PizzaDAO
            </a>
            <a href="https://www.musicaw3.com/" target="_blank" rel="noopener noreferrer" className="rounded transition-colors hover:text-neon-yellow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--neon-yellow)] focus-visible:ring-offset-2 focus-visible:ring-offset-black">
              MusicaW3
            </a>
            <a href="https://metapool.app/" target="_blank" rel="noopener noreferrer" className="rounded transition-colors hover:text-neon-yellow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--neon-yellow)] focus-visible:ring-offset-2 focus-visible:ring-offset-black">
              Meta Pool
            </a>
            {/* TODO: enlazar a la página de reglas del concurso cuando exista */}
            <a href="#" className="rounded transition-colors hover:text-neon-yellow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--neon-yellow)] focus-visible:ring-offset-2 focus-visible:ring-offset-black">
              Reglas del concurso
            </a>
            {/* TODO: enlazar a la licencia CC0 (creativecommons.org) cuando se confirme */}
            <a href="#" className="rounded transition-colors hover:text-neon-yellow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--neon-yellow)] focus-visible:ring-offset-2 focus-visible:ring-offset-black">
              CC0
            </a>
          </nav>

          <div className="mb-8 flex items-center justify-center gap-5 text-white/45">
            {/* TODO: reemplazar "#" con la URL real de X/Twitter */}
            <a href="#" aria-label="X (Twitter)" title="X (Twitter)" className="rounded transition-colors hover:text-neon-yellow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--neon-yellow)] focus-visible:ring-offset-2 focus-visible:ring-offset-black">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
            {/* TODO: reemplazar "#" con la URL real de Farcaster */}
            <a href="#" aria-label="Farcaster" title="Farcaster" className="rounded transition-colors hover:text-neon-yellow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--neon-yellow)] focus-visible:ring-offset-2 focus-visible:ring-offset-black">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M4 6h4M16 6h4" />
                <path d="M5 6v13M19 6v13" />
                <path d="M9 19v-6a3 3 0 0 1 6 0v6" />
                <path d="M3 19h4M17 19h4" />
              </svg>
            </a>
            {/* TODO: reemplazar "#" con la URL real de Telegram */}
            <a href="#" aria-label="Telegram" title="Telegram" className="rounded transition-colors hover:text-neon-yellow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--neon-yellow)] focus-visible:ring-offset-2 focus-visible:ring-offset-black">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.22.22-.42.42-.83.42z" />
              </svg>
            </a>
            {/* TODO: reemplazar "#" con la URL real de Instagram */}
            <a href="#" aria-label="Instagram" title="Instagram" className="rounded transition-colors hover:text-neon-yellow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--neon-yellow)] focus-visible:ring-offset-2 focus-visible:ring-offset-black">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="2" y="2" width="20" height="20" rx="5" />
                <circle cx="12" cy="12" r="4" />
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
              </svg>
            </a>
          </div>

          <p className="text-center text-[10px] uppercase tracking-[0.36em] opacity-30">
            PizzaDAO × MusicaW3 · 2026 · CC0 License
          </p>
        </footer>
      </main>
    </div>
  );
}

export default function HomePage() {
  if (VOTING_PAUSED) {
    return <MaintenanceHomePage />;
  }

  return <HomeClient />;
}
