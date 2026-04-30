import Link from "next/link";

export default function Hero() {
  return (
    <section className="min-h-screen flex flex-col items-center justify-center text-center px-6 pt-14">
      <div className="max-w-3xl mx-auto">
        <p className="text-neon text-xs tracking-[0.4em] uppercase font-mono mb-6">
          Autonomous System
        </p>
        <h1 className="text-5xl md:text-7xl font-mono font-bold tracking-tight text-white mb-6 leading-[1.08]">
          Trim Elite OS
        </h1>
        <p className="text-muted text-base md:text-lg max-w-xl mx-auto mb-10 leading-relaxed">
          Autonomous Client Acquisition Systems.<br className="hidden md:block" />
          Finds leads, audits websites, writes outreach. Runs itself.
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Link
            href="/admin"
            className="px-7 py-3 bg-neon text-bg text-sm font-mono font-bold tracking-wider rounded hover:opacity-90 transition-opacity"
          >
            Request Access
          </Link>
          <a
            href="#agents"
            className="px-7 py-3 border border-panel text-white text-sm font-mono tracking-wider rounded hover:border-neon2/60 transition-colors"
          >
            View Capabilities
          </a>
        </div>
      </div>

      {/* scroll hint */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-40">
        <span className="text-[10px] text-muted font-mono tracking-widest uppercase">scroll</span>
        <span className="text-muted text-sm">↓</span>
      </div>
    </section>
  );
}
