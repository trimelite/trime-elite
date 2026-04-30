"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  getLeads, getMe, logout, createLead, updateLead,
  aiAnalyze, aiOutreach, aiLeadScore,
  type Lead,
} from "@/lib/api";

// ── Primitives ────────────────────────────────────────────────────────────────

function Panel({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="bg-panel border border-panel rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="text-muted text-[10px] tracking-[0.2em] uppercase font-mono">{title}</p>
        {action}
      </div>
      {children}
    </div>
  );
}

function Badge({ value, color = "#64748b" }: { value: string; color?: string }) {
  return (
    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border whitespace-nowrap" style={{ color, borderColor: color }}>
      {value}
    </span>
  );
}

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-panel rounded ${className}`} />;
}

function Modal({ title, content, onClose }: { title: string; content: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4" onClick={onClose}>
      <div className="bg-panel border border-panel rounded-xl p-6 max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <p className="text-neon text-xs font-mono uppercase tracking-wider">{title}</p>
          <button onClick={onClose} className="text-muted hover:text-white text-sm font-mono">✕</button>
        </div>
        <pre className="text-white text-xs font-mono leading-relaxed whitespace-pre-wrap break-words">{content}</pre>
      </div>
    </div>
  );
}

// ── Stats Row ─────────────────────────────────────────────────────────────────

function StatsRow({ leads, loading }: { leads: Lead[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16" />)}
      </div>
    );
  }
  const scored = leads.filter((l) => l.score !== null);
  const avgScore = scored.length > 0 ? Math.round(scored.reduce((s, l) => s + (l.score ?? 0), 0) / scored.length) : 0;
  const stats = [
    { label: "Total Leads",  value: leads.length,                              color: "#00f5c4" },
    { label: "With Website", value: leads.filter((l) => l.website).length,     color: "#0ea5e9" },
    { label: "Low Rating",   value: leads.filter((l) => (l.rating ?? 5) <= 3.8).length, color: "#ef4444" },
    { label: "Avg Score",    value: avgScore || "—",                            color: "#a855f7" },
  ];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {stats.map((s) => (
        <div key={s.label} className="bg-panel border border-panel rounded-xl p-4">
          <p className="text-muted text-[10px] font-mono mb-1">{s.label}</p>
          <p className="text-2xl font-mono font-bold" style={{ color: s.color }}>{s.value}</p>
        </div>
      ))}
    </div>
  );
}

// ── Add Lead Form ─────────────────────────────────────────────────────────────

function AddLeadForm({ onAdded }: { onAdded: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", business: "", website: "", rating: "", issues: "" });
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await createLead({
        name: form.name,
        business: form.business,
        website: form.website,
        rating: form.rating ? parseFloat(form.rating) : null,
        issues: form.issues,
        score: null,
      });
      setForm({ name: "", business: "", website: "", rating: "", issues: "" });
      setOpen(false);
      onAdded();
    } catch {
      // silent
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-[10px] font-mono px-3 py-1.5 border border-neon text-neon rounded hover:bg-neon hover:text-bg transition-colors tracking-wider uppercase"
      >
        + Add Lead
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="border border-panel rounded-xl p-5 mt-4 flex flex-col gap-3">
      <p className="text-muted text-[10px] font-mono uppercase tracking-wider mb-1">New Lead</p>
      {(["name", "business", "website", "rating", "issues"] as const).map((f) => (
        <input
          key={f}
          placeholder={f.charAt(0).toUpperCase() + f.slice(1)}
          value={form[f]}
          type={f === "rating" ? "number" : "text"}
          step={f === "rating" ? "0.1" : undefined}
          min={f === "rating" ? "0" : undefined}
          max={f === "rating" ? "5" : undefined}
          onChange={(e) => setForm((p) => ({ ...p, [f]: e.target.value }))}
          className="bg-bg border border-panel rounded px-3 py-2 text-xs font-mono text-white outline-none focus:border-neon2 transition-colors placeholder:text-muted/50"
        />
      ))}
      <div className="flex gap-2 mt-1">
        <button type="submit" disabled={saving} className="px-4 py-2 bg-neon text-bg text-xs font-mono font-bold rounded disabled:opacity-50">
          {saving ? "Saving..." : "Save"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 border border-panel text-muted text-xs font-mono rounded hover:text-white transition-colors">
          Cancel
        </button>
      </div>
    </form>
  );
}

// ── Leads Table ───────────────────────────────────────────────────────────────

function LeadsTable({ leads, loading, onRefresh }: { leads: Lead[]; loading: boolean; onRefresh: () => void }) {
  const [modal, setModal] = useState<{ title: string; content: string } | null>(null);
  const [busy, setBusy] = useState<Record<number, string>>({});

  async function runAI(lead: Lead, type: "analyze" | "outreach" | "score") {
    setBusy((b) => ({ ...b, [lead.id]: type }));
    try {
      const payload = { business: lead.business, website: lead.website, rating: lead.rating, issues: lead.issues };
      if (type === "analyze") {
        const { analysis } = await aiAnalyze(payload);
        setModal({ title: `Analysis — ${lead.business}`, content: analysis });
      } else if (type === "outreach") {
        const { message } = await aiOutreach(payload);
        setModal({ title: `Outreach — ${lead.business}`, content: message });
      } else {
        const { score, reasoning } = await aiLeadScore(payload);
        await updateLead(lead.id, { score });
        setModal({ title: `Lead Score — ${lead.business}`, content: `Score: ${score}/100\n\n${reasoning}` });
        onRefresh();
      }
    } catch (err) {
      setModal({ title: "Error", content: err instanceof Error ? err.message : "Unknown error" });
    } finally {
      setBusy((b) => { const n = { ...b }; delete n[lead.id]; return n; });
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10" />)}
      </div>
    );
  }

  if (!leads.length) {
    return <p className="text-muted text-xs font-mono py-8 text-center">No leads yet. Add your first lead above.</p>;
  }

  return (
    <>
      {modal && <Modal title={modal.title} content={modal.content} onClose={() => setModal(null)} />}
      <div className="overflow-x-auto">
        <table className="w-full text-[11px] font-mono">
          <thead>
            <tr className="text-muted border-b border-panel">
              {["Business", "Contact", "Rating", "Score", "Issues", "Actions"].map((h) => (
                <th key={h} className="text-left py-2 pr-4 font-normal whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {leads.map((l) => {
              const isBusy = busy[l.id];
              return (
                <tr key={l.id} className="border-b border-panel last:border-0 hover:bg-white/[0.02] transition-colors">
                  <td className="py-3 pr-4">
                    <p className="text-white font-semibold max-w-[140px] truncate">{l.business}</p>
                    {l.website && (
                      <a href={l.website.startsWith("http") ? l.website : `https://${l.website}`} target="_blank" rel="noopener noreferrer"
                        className="text-neon2 text-[10px] hover:underline block truncate max-w-[140px]">
                        {l.website.replace(/^https?:\/\//, "")}
                      </a>
                    )}
                  </td>
                  <td className="py-3 pr-4 text-muted max-w-[100px] truncate">{l.name || "—"}</td>
                  <td className="py-3 pr-4">
                    {l.rating != null
                      ? <Badge value={String(l.rating)} color={l.rating <= 3.5 ? "#ef4444" : l.rating <= 4 ? "#f59e0b" : "#22c55e"} />
                      : <span className="text-muted">—</span>
                    }
                  </td>
                  <td className="py-3 pr-4">
                    {l.score != null
                      ? <Badge value={`${l.score}`} color={l.score >= 70 ? "#00f5c4" : l.score >= 40 ? "#f59e0b" : "#64748b"} />
                      : <span className="text-muted">—</span>
                    }
                  </td>
                  <td className="py-3 pr-4 text-muted max-w-[160px] truncate">{l.issues || "—"}</td>
                  <td className="py-3">
                    <div className="flex gap-1.5">
                      {(["analyze", "outreach", "score"] as const).map((action) => (
                        <button
                          key={action}
                          disabled={!!isBusy}
                          onClick={() => runAI(l, action)}
                          className="px-2 py-1 border border-panel text-muted rounded text-[10px] hover:border-neon hover:text-neon transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                        >
                          {isBusy === action ? "..." : action}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

// ── AI Chat Panel ─────────────────────────────────────────────────────────────

function AiChat() {
  const [messages, setMessages] = useState<{ role: "user" | "ai"; text: string }[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading) return;
    const text = input.trim();
    setInput("");
    setMessages((m) => [...m, { role: "user", text }]);
    setLoading(true);
    try {
      const { reply } = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ message: text }),
      }).then((r) => r.json());
      setMessages((m) => [...m, { role: "ai", text: reply }]);
    } catch {
      setMessages((m) => [...m, { role: "ai", text: "Error — check API key." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="min-h-[180px] max-h-80 overflow-y-auto flex flex-col gap-2 pr-1">
        {messages.length === 0 && (
          <p className="text-muted text-xs font-mono py-4 text-center">Ask anything about your leads or strategy.</p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] px-3 py-2 rounded-lg text-xs font-mono whitespace-pre-wrap ${
              m.role === "user" ? "bg-neon/10 text-neon border border-neon/20" : "bg-panel text-white border border-panel"
            }`}>
              {m.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-panel border border-panel px-3 py-2 rounded-lg text-xs font-mono text-muted animate-pulse">
              thinking...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={send} className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask Claude..."
          className="flex-1 bg-bg border border-panel rounded px-3 py-2 text-xs font-mono text-white outline-none focus:border-neon2 transition-colors placeholder:text-muted/50"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="px-4 py-2 bg-neon text-bg text-xs font-mono font-bold rounded disabled:opacity-40 hover:opacity-90 transition-opacity"
        >
          Send
        </button>
      </form>
    </div>
  );
}

// ── Enterprise View ───────────────────────────────────────────────────────────

type Snap = Record<string, unknown>;

function ERow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex justify-between py-2 border-b border-panel last:border-0 text-xs font-mono">
      <span className="text-muted">{label}</span>
      <span className="text-white">{value}</span>
    </div>
  );
}

function EnterpriseView() {
  const [snap, setSnap] = useState<Snap | null>(null);
  const [running, setRunning] = useState(false);
  const [runMsg, setRunMsg] = useState<string | null>(null);

  function refreshSnap() {
    fetch("/api/enterprise/snapshot", { credentials: "same-origin" })
      .then(r => r.json()).then(setSnap).catch(() => {});
  }

  useEffect(() => { refreshSnap(); }, []);

  async function setDealStage(business: string, stage: string) {
    await fetch("/api/enterprise/deal", {
      method: "POST", credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ business, stage }),
    }).catch(() => {});
    refreshSnap();
  }

  async function runSystem() {
    setRunning(true);
    setRunMsg(null);
    try {
      const res = await fetch("/api/agents/run", { method: "POST", credentials: "same-origin" });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      if (data.snapshot) {
        setSnap(data.snapshot);
      } else {
        refreshSnap();
      }
      if (data.counts) {
        const { leads, scored, outreach, deals } = data.counts;
        setRunMsg(`✓ Leads: ${leads} | Scored: ${scored} | Outreach: ${outreach} | Deals: ${deals}`);
      }
    } catch (e) {
      setRunMsg(`✗ ${e instanceof Error ? e.message : "unknown error"}`);
    }
    setRunning(false);
  }

  type LeadRow = { business?: string; dealStage?: string; score?: number; status?: string };
  type PayRow  = { client?: string; amount?: number; status?: string };
  type DraftRow = { business?: string; message?: string };

  const leads    = (snap?.leads    as LeadRow[]  | null) ?? [];
  const deals    = (snap?.deals    as LeadRow[]  | null) ?? [];
  const clients  = (snap?.clients  as LeadRow[]  | null) ?? [];
  const payments = (snap?.payments as PayRow[]   | null) ?? [];
  const outreach = (snap?.outreach as DraftRow[] | null) ?? [];
  const followups= (snap?.followups as DraftRow[] | null) ?? [];
  const reports  = snap?.reports as Record<string, number | string> | null;

  const revenue  = payments.filter(p => p.status === "paid").reduce((s, p) => s + (p.amount ?? 0), 0);

  return (
    <div className="flex flex-col gap-5">
      <Panel title="System Control">
        <button onClick={runSystem} disabled={running}
          className="w-full py-2.5 border border-neon text-neon rounded text-xs font-mono font-bold tracking-wider hover:bg-neon hover:text-bg transition-colors disabled:opacity-40">
          {running ? "Running System..." : "Run System Now"}
        </button>
        {runMsg && (
          <p className={`mt-3 text-[11px] font-mono ${runMsg.startsWith("✓") ? "text-neon" : "text-red-400"}`}>
            {runMsg}
          </p>
        )}
      </Panel>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Leads",    value: leads.length },
          { label: "Active Deals",   value: deals.length },
          { label: "Clients",        value: clients.length },
          { label: "Revenue",        value: `$${revenue}` },
        ].map(s => (
          <div key={s.label} className="bg-panel border border-panel rounded-xl p-4">
            <p className="text-muted text-[10px] font-mono mb-1">{s.label}</p>
            <p className="text-neon text-2xl font-mono font-bold">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Panel title="Deal Pipeline">
          {deals.length === 0
            ? <p className="text-muted text-xs font-mono">No active deals</p>
            : deals.slice(0, 8).map((d, i) => (
                <div key={i} className="flex items-center justify-between py-2.5 border-b border-panel last:border-0">
                  <div>
                    <p className="text-white text-xs font-mono">{d.business ?? "—"}</p>
                    {(d as {value?: number}).value != null && (
                      <p className="text-neon text-[10px] font-mono">${(d as {value?: number}).value}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Badge value={d.dealStage ?? "—"} color="#0ea5e9" />
                    <button onClick={() => setDealStage(d.business ?? "", "meeting")}
                      className="text-[10px] font-mono px-2 py-0.5 border border-panel text-muted rounded hover:border-neon hover:text-neon transition-colors">
                      Meeting
                    </button>
                    <button onClick={() => setDealStage(d.business ?? "", "closed")}
                      className="text-[10px] font-mono px-2 py-0.5 border border-panel text-muted rounded hover:border-green-500 hover:text-green-400 transition-colors">
                      Close
                    </button>
                  </div>
                </div>
              ))}
        </Panel>

        <Panel title="Outreach Drafts">
          {outreach.length === 0
            ? <p className="text-muted text-xs font-mono">No drafts yet — run agents</p>
            : outreach.slice(0, 5).map((o, i) => (
                <div key={i} className="py-2 border-b border-panel last:border-0">
                  <p className="text-white text-xs font-mono">{o.business}</p>
                  <p className="text-muted text-[10px] font-mono truncate">{o.message?.slice(0, 80)}...</p>
                </div>
              ))}
        </Panel>

        <Panel title="Follow-ups">
          {followups.length === 0
            ? <p className="text-muted text-xs font-mono">No follow-ups yet</p>
            : followups.slice(0, 5).map((f, i) => (
                <ERow key={i} label={f.business ?? "—"} value="queued" />
              ))}
        </Panel>

        <Panel title="Payments">
          {payments.length === 0
            ? <p className="text-muted text-xs font-mono">No payments recorded</p>
            : payments.slice(0, 6).map((p, i) => (
                <ERow key={i} label={`${p.client} — $${p.amount}`} value={p.status ?? "—"} />
              ))}
        </Panel>
      </div>

      {reports && (
        <Panel title="Report">
          {Object.entries(reports).filter(([k]) => k !== "ts").map(([k, v]) => (
            <ERow key={k} label={k} value={String(v)} />
          ))}
        </Panel>
      )}
    </div>
  );
}

// ── Agent Activity ────────────────────────────────────────────────────────────

function AgentActivity() {
  const [data, setData] = useState<{ content: Record<string,unknown> | null; videoAnalysis: Record<string,unknown> | null } | null>(null);
  const [running, setRunning] = useState(false);
  const [runMsg, setRunMsg] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/agents/activity", { credentials: "same-origin" })
      .then((r) => r.json()).then(setData).catch(() => {});
  }, []);

  async function runAgents() {
    setRunning(true);
    setRunMsg(null);
    try {
      const res = await fetch("/api/agents/run", { method: "POST", credentials: "same-origin" });
      const json = await res.json();
      if (json.snapshot) {
        setData({ content: json.snapshot.content, videoAnalysis: null });
      }
      if (json.counts) {
        const { leads, scored, outreach } = json.counts;
        setRunMsg(`✓ Leads: ${leads} | Scored: ${scored} | Outreach: ${outreach}`);
      }
      if (json.error) setRunMsg(`✗ ${json.error}`);
    } catch (e) {
      setRunMsg(`✗ ${e instanceof Error ? e.message : "unknown error"}`);
    }
    setRunning(false);
  }

  type Idea = { title?: string; format?: string; hook?: string };
  const ideas: Idea[] = (data?.content as { ideas?: Idea[] } | null)?.ideas ?? [];
  const videoTs: string | undefined = (data?.videoAnalysis as { ts?: string } | null)?.ts;

  return (
    <div className="flex flex-col gap-5">
      <Panel title="AI Activity">
        <button
          onClick={runAgents}
          disabled={running}
          className="w-full py-2.5 border border-neon text-neon rounded text-xs font-mono font-bold tracking-wider hover:bg-neon hover:text-bg transition-colors disabled:opacity-40 mb-4"
        >
          {running ? "Running agents..." : "Run Agents Now"}
        </button>
        {runMsg && (
          <p className={`mb-4 text-[11px] font-mono ${runMsg.startsWith("✓") ? "text-neon" : "text-red-400"}`}>
            {runMsg}
          </p>
        )}

        <p className="text-muted text-[10px] font-mono uppercase tracking-wider mb-2">Latest Content Ideas</p>
        {ideas.length === 0 ? (
          <p className="text-muted text-xs font-mono">No content generated yet — run agents.</p>
        ) : (
          <div className="flex flex-col gap-0">
            {ideas.map((idea, i) => (
              <div key={i} className="py-2.5 border-b border-panel last:border-0">
                <p className="text-white text-xs font-mono">{idea.title}</p>
                <p className="text-muted text-[10px] font-mono">{idea.format} — {idea.hook}</p>
              </div>
            ))}
          </div>
        )}

        <p className="text-muted text-[10px] font-mono uppercase tracking-wider mt-4 mb-1">Last Video Analysis</p>
        {videoTs ? (
          <p className="text-neon2 text-xs font-mono">{new Date(videoTs).toLocaleString()}</p>
        ) : (
          <p className="text-muted text-xs font-mono">No analysis run yet.</p>
        )}
      </Panel>
    </div>
  );
}

// ── Video Analysis ────────────────────────────────────────────────────────────

function VideoAnalysisButton() {
  const [status, setStatus] = useState<"idle" | "running" | "done" | "error">("idle");
  const label = { idle: "Run AI Analysis", running: "Analyzing...", done: "✓ Done — check ai-system/output.md", error: "Error — retry?" };
  const color = { idle: "border-neon text-neon hover:bg-neon hover:text-bg", running: "border-muted text-muted opacity-50 cursor-not-allowed", done: "border-green-500 text-green-400", error: "border-red-500 text-red-400" };

  async function run() {
    if (status === "running") return;
    setStatus("running");
    try {
      const r = await fetch("/api/ai/video-analysis", { method: "POST", credentials: "same-origin" });
      setStatus(r.ok ? "done" : "error");
    } catch {
      setStatus("error");
    }
  }

  return (
    <button
      onClick={run}
      disabled={status === "running"}
      className={`w-full py-2.5 border rounded text-xs font-mono font-bold tracking-wider transition-colors ${color[status]}`}
    >
      {label[status]}
    </button>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

type Tab = "overview" | "leads" | "ai" | "agents" | "enterprise";

export default function Dashboard() {
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [tab, setTab] = useState<Tab>("overview");
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");

  const load = useCallback(async () => {
    try {
      const [data, me] = await Promise.all([getLeads(), getMe()]);
      setLeads(data);
      setEmail(me.email);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("Unauthorized") || msg.includes("401")) {
        router.push("/admin");
      }
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { load(); }, [load]);

  async function handleLogout() {
    await logout().catch(() => {});
    router.push("/admin");
  }

  const TABS: { key: Tab; label: string }[] = [
    { key: "overview", label: "Overview" },
    { key: "leads", label: "Leads" },
    { key: "ai", label: "AI Tools" },
    { key: "agents", label: "Agents" },
    { key: "enterprise", label: "Enterprise" },
  ];

  return (
    <main className="min-h-screen">
      {/* Topbar */}
      <nav className="border-b border-panel px-6 h-14 flex items-center justify-between sticky top-0 bg-bg/90 backdrop-blur-sm z-10">
        <span className="text-neon text-[11px] tracking-[0.25em] uppercase font-mono">Trim Elite OS</span>
        <div className="flex items-center gap-4">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="text-[11px] font-mono uppercase tracking-wider transition-colors"
              style={{ color: tab === t.key ? "#00f5c4" : "#64748b" }}
            >
              {t.label}
            </button>
          ))}
          <span className="text-muted text-[10px] font-mono hidden sm:block">{email}</span>
          <button
            onClick={handleLogout}
            className="text-muted text-[11px] font-mono uppercase tracking-wider hover:text-white transition-colors"
          >
            Logout
          </button>
        </div>
      </nav>

      {/* Live indicator */}
      <div className="border-b border-panel px-6 py-2 flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-neon inline-block" style={{ boxShadow: "0 0 6px #00f5c4" }} />
        <span className="text-muted text-[10px] font-mono">System online</span>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6 flex flex-col gap-5">

        {tab === "overview" && (
          <>
            <StatsRow leads={leads} loading={loading} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <Panel title="Recent Leads">
                {loading ? (
                  <div className="flex flex-col gap-2">
                    {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-8" />)}
                  </div>
                ) : leads.length === 0 ? (
                  <p className="text-muted text-xs font-mono py-4 text-center">No leads yet</p>
                ) : (
                  <div className="flex flex-col gap-0">
                    {leads.slice(0, 6).map((l) => (
                      <div key={l.id} className="flex items-center justify-between py-2.5 border-b border-panel last:border-0">
                        <div>
                          <p className="text-white text-xs font-mono">{l.business}</p>
                          <p className="text-muted text-[10px] font-mono">{l.name || "—"}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {l.score != null && (
                            <Badge value={`${l.score}`} color={l.score >= 70 ? "#00f5c4" : "#64748b"} />
                          )}
                          {l.rating != null && (
                            <Badge value={`★ ${l.rating}`} color={l.rating <= 3.5 ? "#ef4444" : "#f59e0b"} />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Panel>
              <Panel title="AI Assistant">
                <AiChat />
              </Panel>
            </div>
          </>
        )}

        {tab === "leads" && (
          <Panel
            title={`Leads Database (${leads.length})`}
            action={<AddLeadForm onAdded={load} />}
          >
            <LeadsTable leads={leads} loading={loading} onRefresh={load} />
          </Panel>
        )}

        {tab === "agents" && <AgentActivity />}
        {tab === "enterprise" && <EnterpriseView />}

        {tab === "ai" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <Panel title="AI Chat">
              <AiChat />
            </Panel>
            <Panel title="Quick Tools">
              <div className="flex flex-col gap-3">
                <VideoAnalysisButton />
                <p className="text-muted text-xs font-mono">
                  Select a lead from the Leads tab to run Analyze, Outreach, or Score tools directly from the table.
                </p>
                <div className="border border-panel rounded-lg p-4">
                  <p className="text-white text-xs font-mono font-semibold mb-2">Available AI Tools</p>
                  {[
                    { name: "analyze", desc: "Business weakness analysis + opportunity score" },
                    { name: "outreach", desc: "Personalized cold SMS/email message" },
                    { name: "score", desc: "Lead quality score (1–100) with reasoning" },
                  ].map((t) => (
                    <div key={t.name} className="flex items-start gap-3 py-2.5 border-b border-panel last:border-0">
                      <span className="text-neon text-[10px] font-mono uppercase tracking-wider w-16 flex-shrink-0 pt-px">{t.name}</span>
                      <span className="text-muted text-[10px] font-mono">{t.desc}</span>
                    </div>
                  ))}
                </div>
                <div className="border border-panel rounded-lg p-4">
                  <p className="text-white text-xs font-mono font-semibold mb-2">API Endpoints</p>
                  {["/api/ai/chat", "/api/ai/analyze", "/api/ai/outreach", "/api/ai/lead-score"].map((ep) => (
                    <p key={ep} className="text-neon2 text-[10px] font-mono py-1 border-b border-panel last:border-0">{ep}</p>
                  ))}
                </div>
              </div>
            </Panel>
          </div>
        )}
      </div>
    </main>
  );
}
