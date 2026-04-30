import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { message } = await req.json();
  if (!message) return Response.json({ error: "message required" }, { status: 400 });

  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ reply: "[AI offline — add ANTHROPIC_API_KEY in Railway/Vercel env vars]" });
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  try {
    const res = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 512,
      messages: [{ role: "user", content: message }],
    });
    const reply = res.content[0].type === "text" ? res.content[0].text : "";
    return Response.json({ reply });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "AI error";
    return Response.json({ error: msg }, { status: 500 });
  }
}
