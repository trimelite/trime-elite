import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getSession } from "@/lib/auth";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { business, website, rating, issues } = await req.json();

  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ score: 0, reasoning: "[AI offline — add ANTHROPIC_API_KEY to .env.local]" });
  }

  const prompt = `Score this lead for a digital marketing agency (1-100).

Business: ${business}
Website: ${website ?? "none"}
Rating: ${rating ?? "unknown"}/5
Issues: ${issues ?? "none"}

Scoring criteria:
- No/bad website = high opportunity (+30)
- Low rating (≤3.5) = pain point (+20)
- Local service business = good fit (+20)
- Many issues = high need (+15)
- Has budget signals = bonus (+15)

Respond ONLY with valid JSON in this exact format:
{"score": <number 1-100>, "reasoning": "<one sentence>"}`;

  try {
    const res = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 150,
      messages: [{ role: "user", content: prompt }],
    });
    const text = res.content[0].type === "text" ? res.content[0].text.trim() : "{}";
    const parsed = JSON.parse(text);
    return Response.json({ score: parsed.score ?? 0, reasoning: parsed.reasoning ?? "" });
  } catch {
    return Response.json({ score: 0, reasoning: "Could not score lead" });
  }
}
