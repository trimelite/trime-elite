import { getSession } from "@/lib/auth";
import { execFile } from "child_process";
import path from "path";

export async function POST() {
  const session = await getSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const script = path.join(process.cwd(), "ai-system", "run.js");

  return new Promise<Response>((resolve) => {
    execFile("node", [script], { env: process.env }, (err) => {
      if (err) {
        resolve(Response.json({ error: err.message }, { status: 500 }));
      } else {
        resolve(Response.json({ ok: true }));
      }
    });
  });
}
