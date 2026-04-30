"use strict";
const fs = require("fs");
const path = require("path");

const LOGS = path.join(__dirname, "logs");

function write(file, data) {
  if (!fs.existsSync(LOGS)) fs.mkdirSync(LOGS, { recursive: true });
  fs.writeFileSync(path.join(LOGS, file), JSON.stringify(data, null, 2));
}

function append(file, entry) {
  const fp = path.join(LOGS, file);
  const existing = fs.existsSync(fp) ? JSON.parse(fs.readFileSync(fp, "utf-8")) : [];
  existing.unshift({ ...entry, ts: new Date().toISOString() });
  fs.writeFileSync(fp, JSON.stringify(existing.slice(0, 100), null, 2));
}

function read(file) {
  const fp = path.join(LOGS, file);
  if (!fs.existsSync(fp)) return null;
  try { return JSON.parse(fs.readFileSync(fp, "utf-8")); } catch { return null; }
}

// aliases used by enterprise modules
const writeJSON = write;
function appendJSON(file, entry) { append(file, entry); }

module.exports = { write, append, read, writeJSON, appendJSON };
