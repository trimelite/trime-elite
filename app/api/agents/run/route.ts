import { getSession } from "@/lib/auth";
import { execFile } from "child_process";
import path from "path";

export async function POST() {
  const session = await getSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const script = path.join(process.cwd(), "agents", "scheduler.js");
  execFile("node", [script], { env: process.env as NodeJS.ProcessEnv });
  return Response.json({ ok: true });
}
