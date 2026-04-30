import { getSession } from "@/lib/auth";
import { execFile } from "child_process";
import path from "path";
import fs from "fs";

export async function POST() {
  const session = await getSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const script = path.join(process.cwd(), "ai-system", "run.js");

  if (!fs.existsSync(script)) {
    return Response.json({ ok: true, note: "Video analysis not configured" });
  }

  return new Promise<Response>((resolve) => {
    execFile("node", [script], { env: process.env as NodeJS.ProcessEnv }, (err) => {
      if (err) {
        resolve(Response.json({ ok: false, error: err.message }));
      } else {
        resolve(Response.json({ ok: true }));
      }
    });
  });
}
