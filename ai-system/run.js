"use strict";
const fs = require("fs");
const path = require("path");
const axios = require("axios");

const VIDEO = path.join(__dirname, "input", "video.mp4");
const PROMPT = fs.readFileSync(path.join(__dirname, "prompt.txt"), "utf-8");
const OUT = path.join(__dirname, "output.md");
const KEY = process.env.ANTHROPIC_API_KEY;

if (!KEY) { console.error("Missing ANTHROPIC_API_KEY"); process.exit(1); }
if (!fs.existsSync(VIDEO)) { console.error("No video at ai-system/input/video.mp4"); process.exit(1); }

const data = fs.readFileSync(VIDEO).toString("base64");

axios.post("https://api.anthropic.com/v1/messages", {
  model: "claude-opus-4-7",
  max_tokens: 2048,
  messages: [{
    role: "user",
    content: [
      { type: "text", text: PROMPT },
      { type: "image", source: { type: "base64", media_type: "image/jpeg", data } },
    ],
  }],
}, {
  headers: {
    "x-api-key": KEY,
    "anthropic-version": "2023-06-01",
    "content-type": "application/json",
  },
})
.then(r => {
  const text = r.data.content[0].text;
  fs.writeFileSync(OUT, text);
  console.log("✓ Saved to ai-system/output.md");
  // also persist to agents log
  const logPath = path.join(__dirname, "..", "agents", "logs", "video-analysis.json");
  fs.mkdirSync(path.dirname(logPath), { recursive: true });
  fs.writeFileSync(logPath, JSON.stringify({ ts: new Date().toISOString(), analysis: text }, null, 2));
})
.catch(e => console.error("API error:", e.response?.data ?? e.message));
