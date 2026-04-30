import { getSession } from "@/lib/auth";
import fs from "fs";
import path from "path";

const LOGS = path.join(process.cwd(), "agents", "logs");

function r(file: string) {
  // Read from in-memory store first (populated by the run route in same process)
  const store = (globalThis as Record<string, unknown>).__AGENT_STORE__ as Record<string, unknown> | undefined;
  if (store && store[file] !== undefined) return store[file];

  // Fall back to filesystem (Railway persistent volume)
  const fp = path.join(LOGS, file);
  try {
    if (fs.existsSync(fp)) return JSON.parse(fs.readFileSync(fp, "utf-8"));
  } catch { /* ignore */ }
  return null;
}

export async function GET() {
  const session = await getSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  return Response.json({
    leads:     r("leads.json"),
    content:   r("content.json"),
    outreach:  r("outreach-drafts.json"),
    followups: r("followups.json"),
    replies:   r("replies.json"),
    deals:     r("deals.json"),
    posts:     r("posts.json"),
    clients:   r("clients.json"),
    payments:  r("payments.json"),
    calendar:  r("calendar.json"),
    reports:   r("reports.json"),
    video:     r("video-analysis.json"),
  });
}
