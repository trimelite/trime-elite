import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-panel py-10 px-6">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <span className="text-neon text-xs tracking-[0.25em] uppercase font-mono">Trim Elite OS</span>
        <p className="text-muted text-xs font-mono">
          © {new Date().getFullYear()} Trim Elite — Private System
        </p>
        <Link href="/admin" className="text-muted text-xs font-mono hover:text-neon transition-colors tracking-wider uppercase">
          Private Access →
        </Link>
      </div>
    </footer>
  );
}
