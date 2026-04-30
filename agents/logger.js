"use strict";
const fs   = require("fs");
const path = require("path");

const LOGS = path.join(__dirname, "logs");

// In-memory cache — survives within the same process/request chain
if (!globalThis.__AGENT_STORE__) globalThis.__AGENT_STORE__ = {};
const store = globalThis.__AGENT_STORE__;

function write(file, data) {
  store[file] = data;
  try {
    if (!fs.existsSync(LOGS)) fs.mkdirSync(LOGS, { recursive: true });
    fs.writeFileSync(path.join(LOGS, file), JSON.stringify(data, null, 2));
  } catch { /* fs unavailable (Vercel) — memory store is source of truth */ }
}

function append(file, entry) {
  const existing = read(file) ?? [];
  existing.unshift({ ...entry, ts: new Date().toISOString() });
  write(file, existing.slice(0, 100));
}

function read(file) {
  if (store[file] !== undefined) return store[file];
  const fp = path.join(LOGS, file);
  try {
    if (fs.existsSync(fp)) {
      const parsed = JSON.parse(fs.readFileSync(fp, "utf-8"));
      store[file] = parsed;
      return parsed;
    }
  } catch { /* ignore */ }
  return null;
}

const writeJSON = write;
function appendJSON(file, entry) { append(file, entry); }

module.exports = { write, append, read, writeJSON, appendJSON };
