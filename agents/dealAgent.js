"use strict";
const { getLeads, saveLeads } = require("./leadAgent");
const { write } = require("./logger");

const STAGES = ["none", "contacted", "qualified", "meeting", "closed"];

function setStage(business, stage, value) {
  const leads = getLeads();
  const lead  = leads.find(l => l.business === business);
  if (!lead || !STAGES.includes(stage)) return null;
  lead.dealStage = stage;
  if (stage === "closed") {
    lead.client    = true;
    lead.closedAt  = new Date().toISOString();
    if (value != null) lead.dealValue = value;
  }
  saveLeads(leads);
  return lead;
}

function advance(business) {
  const leads = getLeads();
  const lead  = leads.find(l => l.business === business);
  if (!lead) return null;
  const idx = STAGES.indexOf(lead.dealStage);
  if (idx < STAGES.length - 1) setStage(business, STAGES[idx + 1]);
  return lead;
}

function run() {
  const leads = getLeads();
  const deals = leads
    .filter(l => l.dealStage !== "none")
    .map(l => ({
      business: l.business,
      stage:    l.dealStage,
      value:    l.dealValue ?? null,
      closedAt: l.closedAt  ?? null,
      client:   l.client,
      ts:       new Date().toISOString(),
    }));
  write("deals.json", deals);
  console.log("[dealAgent] ✓ tracked", deals.length, "deals");
}

module.exports = { advance, setStage, run };
if (require.main === module) run();
