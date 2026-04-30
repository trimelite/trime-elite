import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";

const claude = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
  const { prompt, mode } = await req.json();

  if (mode === "claude") {
    const msg = await claude.messages.create({
      model: "claude-3-sonnet-20240229",
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }],
    });

    return NextResponse.json({ output: msg.content[0].text });
  }

  if (mode === "gpt") {
    const chat = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
    });

    return NextResponse.json({ output: chat.choices[0].message.content });
  }
}