import { getSession } from "@/lib/auth";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { business, stage, value } = await req.json();
  if (!business || !stage) return Response.json({ error: "business and stage required" }, { status: 400 });

  // Dynamically require to avoid bundling Node-only modules
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { setStage } = require("../../../../agents/dealAgent");
  const lead = setStage(business, stage, value ?? null);
  if (!lead) return Response.json({ error: "Lead not found or invalid stage" }, { status: 404 });
  return Response.json({ ok: true, lead });
}
