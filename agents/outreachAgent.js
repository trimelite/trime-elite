"use strict";
const { getLeads, saveLeads } = require("./leadAgent");
const { write } = require("./logger");
const cfg = require("./config.json");

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

async function run() {
  const leads  = getLeads();
  const queue  = leads.filter(l => l.status === "new" && l.score > 50);
  const drafts = [];
  let sent = 0;

  for (const lead of queue) {
    if (sent >= cfg.dailyEmailLimit) break;
    const contact = lead.website || lead.business;
    const msg = `Hey ${lead.name || "there"}, quick question — is your ${contact} bringing you consistent customers right now?\n\nI noticed a few things that could be improved (speed, layout, conversions).\n\nI help businesses fix that and turn their site into something that actually brings in clients.\n\nWant me to show you what I mean?`;
    try {
      drafts.push({ business: lead.business, email: lead.email, message: msg, ts: new Date().toISOString() });
      lead.status      = "contacted";
      lead.lastContact = new Date().toISOString();
      sent++;
      if (cfg.allowAutoSend && lead.email) {
        // SMTP send — requires nodemailer; skipped until allowAutoSend=true
        console.log("[outreachAgent] auto-send skipped (allowAutoSend=false)");
      }
      const ms = cfg.minDelayMs + Math.random() * (cfg.maxDelayMs - cfg.minDelayMs);
      await delay(ms);
    } catch (e) { console.error("[outreachAgent]", lead.business, e.message); }
  }

  write("outreach-drafts.json", drafts);
  saveLeads(leads);
  console.log("[outreachAgent] ✓ drafted", drafts.length, "messages");
}

module.exports = { run };
if (require.main === module) run();
