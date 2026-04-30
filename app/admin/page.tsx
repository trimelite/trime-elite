"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { login } from "@/lib/api";

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      router.push("/admin/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <Link href="/" className="block text-center mb-10">
          <span className="text-neon text-xs tracking-[0.3em] uppercase font-mono">Trim Elite OS</span>
        </Link>

        <div className="bg-panel border border-panel rounded-xl p-8">
          <h1 className="text-white text-lg font-mono font-bold mb-1">System Access</h1>
          <p className="text-muted text-xs font-mono mb-7">Authorized personnel only</p>

          <form onSubmit={submit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-muted text-[10px] font-mono uppercase tracking-wider">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="bg-bg border border-panel rounded px-3 py-2.5 text-sm font-mono text-white outline-none focus:border-neon2 transition-colors"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-muted text-[10px] font-mono uppercase tracking-wider">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="bg-bg border border-panel rounded px-3 py-2.5 text-sm font-mono text-white outline-none focus:border-neon2 transition-colors"
              />
            </div>

            {error && (
              <p className="text-red-400 text-xs font-mono">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 py-3 rounded bg-neon text-bg text-sm font-mono font-bold tracking-wider disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
            >
              {loading ? "Authenticating..." : "Enter"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
