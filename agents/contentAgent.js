"use strict";
const https = require("https");
const { write } = require("./logger");

const NICHES = ["local service business", "cleaning company", "landscaping", "auto repair", "restaurant"];
const NICHE  = NICHES[Math.floor(Math.random() * NICHES.length)];

const PROMPT = `Generate content ideas for a digital marketing agency targeting ${NICHE} businesses.
Return ONLY valid JSON in this exact shape — no markdown, no extra text:
{
  "ideas": [
    {"title": "...", "format": "Reel|YouTube|TikTok", "hook": "..."},
    {"title": "...", "format": "Reel|YouTube|TikTok", "hook": "..."},
    {"title": "...", "format": "Reel|YouTube|TikTok", "hook": "..."}
  ],
  "script": "60-second script for the first idea"
}`;

function callClaude(prompt) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 800,
      messages: [{ role: "user", content: prompt }],
    });
    const req = https.request({
      hostname: "api.anthropic.com",
      path: "/v1/messages",
      method: "POST",
      headers: {
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
        "content-length": Buffer.byteLength(body),
      },
    }, (res) => {
      let raw = "";
      res.on("data", (c) => raw += c);
      res.on("end", () => {
        try { resolve(JSON.parse(raw)); }
        catch { reject(new Error("Bad JSON from API")); }
      });
    });
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

async function run() {
  if (!process.env.ANTHROPIC_API_KEY) {
    write("content.json", { error: "Missing ANTHROPIC_API_KEY", ts: new Date().toISOString() });
    return;
  }
  try {
    const res = await callClaude(PROMPT);
    const text = res.content?.[0]?.text ?? "{}";
    const parsed = JSON.parse(text);
    write("content.json", { ...parsed, niche: NICHE, ts: new Date().toISOString() });
    console.log("[contentAgent] ✓ saved content.json");
  } catch (e) {
    write("content.json", { error: e.message, ts: new Date().toISOString() });
    console.error("[contentAgent] error:", e.message);
  }
}

module.exports = { run };
if (require.main === module) run();
