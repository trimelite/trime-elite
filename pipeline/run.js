#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

// Load .env from pipeline/ directory before anything else
const envFile = path.join(__dirname, ".env");
if (fs.existsSync(envFile)) {
  const lines = fs.readFileSync(envFile, "utf-8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim().replace(/^['"]|['"]$/g, "");
    if (key && !process.env[key]) process.env[key] = val;
  }
}

// ── Paths ─────────────────────────────────────────────────────────────────────

const ROOT      = __dirname;
const INPUT_DIR = path.join(ROOT, "input");
const OUTPUT_DIR= path.join(ROOT, "output");
const FRAMES_DIR= path.join(ROOT, "frames");
const PROMPT_FILE = path.join(ROOT, "prompt.txt");

// Resolve SDK and ffmpeg from the parent Next.js project's node_modules
const NM = path.join(ROOT, "..", "node_modules");
const ffmpegBin = require(path.join(NM, "ffmpeg-static"));
const ffmpeg    = require(path.join(NM, "fluent-ffmpeg"));
const Anthropic  = require(path.join(NM, "@anthropic-ai", "sdk")).default;

// ── Config ────────────────────────────────────────────────────────────────────

const FRAME_INTERVAL = 5;       // extract one frame every N seconds
const MAX_FRAMES     = 20;      // cap to stay within API limits (images per request)
const MODEL          = "claude-opus-4-7"; // most capable vision model
const MAX_TOKENS     = 4096;

// ── Helpers ───────────────────────────────────────────────────────────────────

function log(msg) {
  process.stdout.write(`[pipeline] ${msg}\n`);
}

function die(msg) {
  process.stderr.write(`\n[ERROR] ${msg}\n`);
  process.exit(1);
}

function ensureDirs() {
  [INPUT_DIR, OUTPUT_DIR, FRAMES_DIR].forEach((d) => {
    if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
  });
}

function clearFrames() {
  if (fs.existsSync(FRAMES_DIR)) {
    fs.readdirSync(FRAMES_DIR)
      .filter((f) => f.endsWith(".jpg"))
      .forEach((f) => fs.unlinkSync(path.join(FRAMES_DIR, f)));
  }
}

function findVideo() {
  if (!fs.existsSync(INPUT_DIR)) die(`input/ directory not found at ${INPUT_DIR}`);
  const VIDEO_EXTS = [".mp4", ".mov", ".avi", ".mkv", ".webm", ".m4v", ".flv"];
  const files = fs.readdirSync(INPUT_DIR).filter((f) => {
    const ext = path.extname(f).toLowerCase();
    return VIDEO_EXTS.includes(ext);
  });
  if (files.length === 0) {
    die(
      `No video file found in ${INPUT_DIR}\n` +
      `Supported formats: ${VIDEO_EXTS.join(", ")}\n` +
      `Drop your video into pipeline/input/ and run again.`
    );
  }
  if (files.length > 1) {
    log(`Multiple videos found — using: ${files[0]}`);
  }
  return path.join(INPUT_DIR, files[0]);
}

function getVideoDuration(videoPath) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, (err, meta) => {
      if (err) return reject(err);
      resolve(meta.format.duration || 60);
    });
  });
}

function extractFrames(videoPath, duration) {
  return new Promise((resolve, reject) => {
    const interval = Math.max(1, Math.min(FRAME_INTERVAL, Math.floor(duration / MAX_FRAMES)));
    const frameCount = Math.min(MAX_FRAMES, Math.floor(duration / interval));

    log(`Video duration: ${Math.round(duration)}s — extracting ${frameCount} frames (1 every ${interval}s)`);

    ffmpeg.setFfmpegPath(ffmpegBin);

    ffmpeg(videoPath)
      .on("error", reject)
      .on("end", () => {
        const frames = fs.readdirSync(FRAMES_DIR)
          .filter((f) => f.endsWith(".jpg"))
          .sort()
          .map((f) => path.join(FRAMES_DIR, f));
        log(`Extracted ${frames.length} frames`);
        resolve(frames);
      })
      .outputOptions([
        `-vf fps=1/${interval},scale=960:-1`,
        `-frames:v ${frameCount}`,
        "-q:v 3",
      ])
      .output(path.join(FRAMES_DIR, "frame_%04d.jpg"))
      .run();
  });
}

function framesToBase64(framePaths) {
  return framePaths.map((fp) => {
    const data = fs.readFileSync(fp);
    return data.toString("base64");
  });
}

async function analyzeWithClaude(frames64, videoPath, masterPrompt) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    die(
      "ANTHROPIC_API_KEY is not set.\n" +
      "Add it to pipeline/.env or export it in your shell:\n" +
      "  export ANTHROPIC_API_KEY=sk-ant-..."
    );
  }

  const client = new Anthropic({ apiKey });

  log(`Sending ${frames64.length} frames to Claude (${MODEL})...`);

  // Build content array: text intro + all image blocks + master prompt
  const content = [];

  content.push({
    type: "text",
    text:
      `The following ${frames64.length} images are frames extracted from a video file ` +
      `("${path.basename(videoPath)}") at regular intervals from start to finish. ` +
      `Frame 1 is near the beginning, frame ${frames64.length} is near the end.\n\n` +
      `Please analyze this video thoroughly using the instructions below.`,
  });

  for (let i = 0; i < frames64.length; i++) {
    content.push({
      type: "text",
      text: `**Frame ${i + 1} of ${frames64.length}**`,
    });
    content.push({
      type: "image",
      source: {
        type: "base64",
        media_type: "image/jpeg",
        data: frames64[i],
      },
    });
  }

  content.push({
    type: "text",
    text: masterPrompt,
  });

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    messages: [{ role: "user", content }],
  });

  const block = response.content.find((b) => b.type === "text");
  if (!block) die("Claude returned no text content");
  return block.text;
}

function buildReport(analysis, videoPath, frameCount) {
  const videoName = path.basename(videoPath);
  const timestamp = new Date().toISOString().replace("T", " ").slice(0, 19) + " UTC";

  return [
    `# Video Analysis Report`,
    ``,
    `| Field | Value |`,
    `|-------|-------|`,
    `| File | \`${videoName}\` |`,
    `| Frames analyzed | ${frameCount} |`,
    `| Model | ${MODEL} |`,
    `| Generated | ${timestamp} |`,
    ``,
    `---`,
    ``,
    analysis,
    ``,
    `---`,
    ``,
    `*Generated by Trim Elite OS video pipeline*`,
  ].join("\n");
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log("\n┌─────────────────────────────────────────┐");
  console.log("│   Trim Elite OS — Video Analysis Pipeline │");
  console.log("└─────────────────────────────────────────┘\n");

  ensureDirs();
  clearFrames();

  // 1. Find video
  const videoPath = findVideo();
  log(`Video: ${path.basename(videoPath)}`);

  // 2. Read master prompt
  if (!fs.existsSync(PROMPT_FILE)) die(`prompt.txt not found at ${PROMPT_FILE}`);
  const masterPrompt = fs.readFileSync(PROMPT_FILE, "utf-8").trim();
  log("Prompt loaded");

  // 3. Extract frames
  let duration;
  try {
    duration = await getVideoDuration(videoPath);
  } catch (err) {
    die(`Could not read video metadata: ${err.message}\nIs the file a valid video?`);
  }

  let framePaths;
  try {
    framePaths = await extractFrames(videoPath, duration);
  } catch (err) {
    die(`Frame extraction failed: ${err.message}`);
  }

  if (framePaths.length === 0) die("No frames were extracted — check the video file");

  // 4. Convert frames to base64
  log("Encoding frames...");
  const frames64 = framesToBase64(framePaths);

  // 5. Send to Claude
  let analysis;
  try {
    analysis = await analyzeWithClaude(frames64, videoPath, masterPrompt);
  } catch (err) {
    if (err.status === 401) die("Invalid ANTHROPIC_API_KEY — check your credentials");
    if (err.status === 429) die("Rate limit hit — wait a moment and retry");
    if (err.status === 400) die(`Bad request: ${err.message}`);
    die(`Claude API error: ${err.message}`);
  }

  // 6. Write output
  const report = buildReport(analysis, videoPath, framePaths.length);
  const outPath = path.join(OUTPUT_DIR, "analysis.md");
  fs.writeFileSync(outPath, report, "utf-8");

  // 7. Also write raw JSON for programmatic use
  const jsonOut = {
    video: path.basename(videoPath),
    model: MODEL,
    frames_analyzed: framePaths.length,
    generated_at: new Date().toISOString(),
    analysis,
  };
  fs.writeFileSync(
    path.join(OUTPUT_DIR, "analysis.json"),
    JSON.stringify(jsonOut, null, 2),
    "utf-8"
  );

  // 8. Clean up frames
  clearFrames();

  console.log("\n✓ Analysis complete\n");
  console.log(`  output/analysis.md   — full markdown report`);
  console.log(`  output/analysis.json — raw JSON\n`);
}

main().catch((err) => {
  die(err.message || String(err));
});
