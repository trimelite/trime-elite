import { getSession } from "@/lib/auth";
import fs from "fs";
import path from "path";

function readLog(file: string) {
  const fp = path.join(process.cwd(), "agents", "logs", file);
  if (!fs.existsSync(fp)) return null;
  try { return JSON.parse(fs.readFileSync(fp, "utf-8")); } catch { return null; }
}

export async function GET() {
  const session = await getSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  return Response.json({
    content: readLog("content.json"),
    videoAnalysis: readLog("video-analysis.json"),
    leads: readLog("leads.json"),
  });
}
