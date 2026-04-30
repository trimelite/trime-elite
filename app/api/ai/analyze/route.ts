import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getSession } from "@/lib/auth";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { business, website, rating, issues } = await req.json();

  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ analysis: "[AI offline — add ANTHROPIC_API_KEY to .env.local]" });
  }

  const prompt = `Analyze this local business as a potential client for a digital marketing agency:

Business: ${business}
Website: ${website ?? "none"}
Rating: ${rating ?? "unknown"}/5
Known issues: ${issues ?? "none listed"}

Provide a concise analysis covering:
1. Main weaknesses (2-3 bullet points)
2. Opportunity score (1-10)
3. Best angle for outreach

Be direct and actionable. Max 150 words.`;

  try {
    const res = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 300,
      messages: [{ role: "user", content: prompt }],
    });
    const analysis = res.content[0].type === "text" ? res.content[0].text : "";
    return Response.json({ analysis });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "AI error";
    return Response.json({ error: msg }, { status: 500 });
  }
}
