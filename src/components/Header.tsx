"use client";

import Link from "next/link";
import { Music2, ExternalLink } from "lucide-react";

export function Header() {
  return (
    <header className="fixed top-0 left-0 z-50 w-full border-b border-white/10 backdrop-blur-md" style={{
      background: "rgba(0,0,0,0.8)",
    }}>
      <div className="w-full h-20 flex items-center justify-center">
        {/* Centered Nav with Logos */}
        <nav className="flex items-center gap-12">
          <a
            href="https://www.musicaw3.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:scale-110 transition-transform opacity-80 hover:opacity-100"
          >
            <img 
              src="https://www.musicaw3.com/logo-mw3.png" 
              alt="MusicaW3" 
              className="h-6 md:h-8 w-auto object-contain"
            />
          </a>
          
          <a
            href="https://globalpizza.party/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:scale-110 transition-transform opacity-80 hover:opacity-100 flex items-center justify-center"
          >
            {/* Cropped PizzaDAO Logo (Only Symbol) for header - Adjusted width to prevent cutoff */}
            <div className="w-[38px] h-8 md:w-[48px] md:h-10 overflow-hidden relative flex items-center justify-start">
              <img 
                src="https://globalpizza.party/assets/pizzadao-logo-DYYagcIv.png" 
                alt="PizzaDAO" 
                className="absolute left-0 h-full w-auto max-w-none"
              />
            </div>
          </a>
        </nav>
      </div>
    </header>
  );
}
