"use strict";
const fs   = require("fs");
const path = require("path");
const { write, read } = require("./logger");

const SEED = path.join(__dirname, "leads-seed.json");

function normalize(raw) {
  return {
    name:        raw.name        ?? "",
    business:    raw.business    ?? "",
    website:     raw.website     ?? "",
    email:       raw.email       ?? "",
    status:      raw.status      ?? "new",
    score:       raw.score       ?? 0,
    lastContact: raw.lastContact ?? null,
    dealStage:   raw.dealStage   ?? "none",
    client:      raw.client      ?? false,
  };
}

function getLeads() { return read("leads.json") ?? []; }

function addLead(raw) {
  const lead = normalize(raw);
  if (!lead.name || !lead.business) throw new Error("name and business required");
  const leads = getLeads();
  if (leads.some(l => l.business === lead.business && l.name === lead.name)) return;
  leads.unshift(lead);
  write("leads.json", leads);
  console.log("[leadAgent] ✓ added:", lead.business);
}

function saveLeads(leads) { write("leads.json", leads); }

function run() {
  let leads = getLeads();
  if (fs.existsSync(SEED)) {
    const seeds = JSON.parse(fs.readFileSync(SEED, "utf-8"));
    const existing = new Set(leads.map(l => l.business + "|" + l.name));
    const added = seeds.filter(s => !existing.has((s.business ?? "") + "|" + (s.name ?? "")))
                       .map(normalize);
    if (added.length) {
      leads = [...added, ...leads];
      write("leads.json", leads);
    }
  }
  console.log("[leadAgent] leads on file:", leads.length);
}

module.exports = { addLead, getLeads, saveLeads, run };
if (require.main === module) run();
