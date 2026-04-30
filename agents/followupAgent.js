"use strict";
const { getLeads, saveLeads } = require("./leadAgent");
const { write } = require("./logger");
const cfg = require("./config.json");

const TEMPLATES = [
  "Just wanted to follow up — not sure if you saw this. Worth a quick look?",
  "All good if now's not the time — should I circle back later?",
];

function daysSince(iso) {
  return (Date.now() - new Date(iso).getTime()) / 86400000;
}

function run() {
  const leads = getLeads();
  const followups = [];

  for (const lead of leads) {
    const fu = lead.followUpCount ?? 0;
    if (fu >= 2) continue;
    if (!["contacted", "follow-up"].includes(lead.status)) continue;
    if (!lead.lastContact || daysSince(lead.lastContact) < cfg.followUpDays) continue;

    const msg = TEMPLATES[fu];
    followups.push({ business: lead.business, email: lead.email, followUp: fu + 1, message: msg, ts: new Date().toISOString() });
    lead.status         = "follow-up";
    lead.followUpCount  = fu + 1;
    lead.lastContact    = new Date().toISOString();
  }

  write("followups.json", followups);
  saveLeads(leads);
  console.log("[followupAgent] ✓ drafted", followups.length, "follow-ups");
}

module.exports = { run };
if (require.main === module) run();
