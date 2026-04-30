// All API calls go to Next.js route handlers (same origin)

async function apiFetch<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  try {
    const res = await fetch(path, {
      ...opts,
      headers: { "Content-Type": "application/json", ...(opts.headers as Record<string, string> ?? {}) },
      signal: controller.signal,
      credentials: "same-origin",
    });
    clearTimeout(timer);
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error ?? "Request failed");
    }
    return res.json() as Promise<T>;
  } catch (err: unknown) {
    clearTimeout(timer);
    if (err instanceof Error && err.name === "AbortError") throw new Error("Request timed out");
    throw err;
  }
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export async function login(email: string, password: string): Promise<void> {
  await apiFetch("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function logout(): Promise<void> {
  await apiFetch("/api/auth/logout", { method: "POST" });
}

export async function getMe(): Promise<{ email: string }> {
  return apiFetch("/api/auth/me");
}

// ── Leads ─────────────────────────────────────────────────────────────────────

export type Lead = {
  id: number;
  name: string;
  business: string;
  website: string;
  rating: number | null;
  issues: string;
  score: number | null;
  createdAt: string;
};

export async function getLeads(): Promise<Lead[]> {
  return apiFetch("/api/leads");
}

export async function createLead(data: Omit<Lead, "id" | "createdAt">): Promise<Lead> {
  return apiFetch("/api/leads", { method: "POST", body: JSON.stringify(data) });
}

export async function updateLead(id: number, patch: Partial<Lead>): Promise<Lead> {
  return apiFetch(`/api/leads/${id}`, { method: "PATCH", body: JSON.stringify(patch) });
}

// ── AI ────────────────────────────────────────────────────────────────────────

export async function aiChat(message: string): Promise<{ reply: string }> {
  return apiFetch("/api/ai/chat", { method: "POST", body: JSON.stringify({ message }) });
}

export async function aiAnalyze(lead: Pick<Lead, "business" | "website" | "rating" | "issues">): Promise<{ analysis: string }> {
  return apiFetch("/api/ai/analyze", { method: "POST", body: JSON.stringify(lead) });
}

export async function aiOutreach(lead: Pick<Lead, "business" | "website" | "rating" | "issues">): Promise<{ message: string }> {
  return apiFetch("/api/ai/outreach", { method: "POST", body: JSON.stringify(lead) });
}

export async function aiLeadScore(lead: Pick<Lead, "business" | "website" | "rating" | "issues">): Promise<{ score: number; reasoning: string }> {
  return apiFetch("/api/ai/lead-score", { method: "POST", body: JSON.stringify(lead) });
}

// Legacy stubs so AgentGrid doesn't hard-crash while offline
export type PublicAgentStatus = { name: string; description: string; status: string };
export type AgentStatus = PublicAgentStatus & { last_run: string | null; last_finished: string | null; records_last_run: number; last_error: string | null };
export type TaskEntry = { name: string; interval: string; next_run: string };

export async function getPublicAgentStatus(): Promise<PublicAgentStatus[]> {
  return [];
}
