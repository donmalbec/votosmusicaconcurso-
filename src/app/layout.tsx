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
  metadataBase: new URL("https://canciondepizza.fun"),
  title: "PizzaDAO × MusicaW3 — Votaciones Pausadas",
  description: "Las votaciones están pausadas temporalmente por mantenimiento del sitio. El ranking sigue visible mientras volvemos.",
  keywords: ["PizzaDAO", "MusicaW3", "concurso musical", "Web3", "votación", "música latina"],
  openGraph: {
    title: "PizzaDAO × MusicaW3 — Votaciones Pausadas",
    description: "Estamos haciendo mantenimiento del sitio. Las votaciones se reactivarán pronto.",
    url: "https://canciondepizza.fun",
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
