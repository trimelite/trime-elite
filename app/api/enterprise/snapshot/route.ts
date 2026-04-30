import { getSession } from "@/lib/auth";
import fs from "fs";
import path from "path";

const LOGS = path.join(process.cwd(), "agents", "logs");

function r(file: string) {
  const store = (globalThis as Record<string, unknown>).__AGENT_STORE__ as Record<string, unknown> | undefined;
  if (store && store[file] !== undefined) return store[file];

  const fp = path.join(LOGS, file);
  try {
    if (fs.existsSync(fp)) return JSON.parse(fs.readFileSync(fp, "utf-8"));
  } catch { /* ignore */ }
  return null;
}

function hasData() {
  const leads = r("leads.json");
  return Array.isArray(leads) && leads.length > 0;
}

function seedStore() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { write } = require("../../../../agents/logger");
    const seedPath = path.join(process.cwd(), "agents", "leads-seed.json");
    if (fs.existsSync(seedPath)) {
      const seeds = JSON.parse(fs.readFileSync(seedPath, "utf-8"));
      if (seeds.length) write("leads.json", seeds);
    }
  } catch { /* ignore */ }
}

export async function GET() {
  const session = await getSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  // On Vercel, memory is empty on first GET — seed from the static file so the
  // dashboard is never blank before the user clicks "Run System"
  if (!hasData()) seedStore();

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
