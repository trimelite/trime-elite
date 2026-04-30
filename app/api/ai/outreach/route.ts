import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getSession } from "@/lib/auth";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { business, website, rating, issues } = await req.json();

  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ message: "[AI offline — add ANTHROPIC_API_KEY to .env.local]" });
  }

  const prompt = `Write a cold outreach SMS message for this local business. Be conversational, not salesy.

Business: ${business}
Website: ${website ?? "no website"}
Rating: ${rating ?? "unknown"}/5
Issues: ${issues ?? "general improvement needed"}

Requirements:
- Under 160 characters
- Mention one specific pain point
- End with a soft question
- Sound like a human, not a bot

Output ONLY the SMS text, nothing else.`;

  try {
    const res = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 200,
      messages: [{ role: "user", content: prompt }],
    });
    const message = res.content[0].type === "text" ? res.content[0].text.trim() : "";
    return Response.json({ message });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "AI error";
    return Response.json({ error: msg }, { status: 500 });
  }
}
