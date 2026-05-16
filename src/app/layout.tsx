import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PizzaDAO × MusicaW3 — Vota por tu Canción Favorita",
  description: "Vota por los mejores artistas hispanohablantes en el primer concurso musical de PizzaDAO y MusicaW3. Un solo voto por correo. Cierra pronto.",
  keywords: ["PizzaDAO", "MusicaW3", "concurso musical", "Web3", "votación", "música latina"],
  openGraph: {
    title: "PizzaDAO × MusicaW3 — Vota Ahora",
    description: "El primer concurso musical cripto en español. Vota por tu artista favorito.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Space+Mono:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
