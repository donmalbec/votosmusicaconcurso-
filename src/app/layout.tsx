import type { Metadata } from "next";
import { Space_Grotesk, Space_Mono } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});

const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-space-mono",
});

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
    <html lang="es" className={`${spaceGrotesk.variable} ${spaceMono.variable}`} suppressHydrationWarning>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
