import { getSession } from "@/lib/auth";
import fs from "fs";
import path from "path";

function readLog(file: string) {
  const store = (globalThis as Record<string, unknown>).__AGENT_STORE__ as Record<string, unknown> | undefined;
  if (store && store[file] !== undefined) return store[file];

  const fp = path.join(process.cwd(), "agents", "logs", file);
  try {
    if (fs.existsSync(fp)) return JSON.parse(fs.readFileSync(fp, "utf-8"));
  } catch { /* ignore */ }
  return null;
}

export async function GET() {
  const session = await getSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  return Response.json({
    content:       readLog("content.json"),
    videoAnalysis: readLog("video-analysis.json"),
    leads:         readLog("leads.json"),
  });
}
