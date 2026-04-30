"use client";
import Link from "next/link";

export default function Nav() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-panel bg-bg/80 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link href="/" className="text-neon text-xs tracking-[0.25em] uppercase font-mono font-semibold">
          Trim Elite OS
        </Link>
        <div className="flex items-center gap-6">
          <a href="#agents" className="text-muted text-xs tracking-widest uppercase hover:text-white transition-colors hidden sm:block">
            Agents
          </a>
          <a href="#how" className="text-muted text-xs tracking-widest uppercase hover:text-white transition-colors hidden sm:block">
            How It Works
          </a>
          <Link
            href="/admin"
            className="text-xs px-4 py-1.5 border border-panel text-muted rounded hover:border-neon hover:text-neon transition-colors tracking-wider uppercase"
          >
            Private Access
          </Link>
        </div>
      </div>
    </header>
  );
}
