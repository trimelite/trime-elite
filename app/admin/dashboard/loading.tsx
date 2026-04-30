export default function Loading() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-6 h-6 border-2 border-neon border-t-transparent rounded-full animate-spin" />
        <p className="text-muted text-xs font-mono tracking-widest uppercase">Loading</p>
      </div>
    </main>
  );
}
