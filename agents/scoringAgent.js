"use strict";
const { getLeads, saveLeads } = require("./leadAgent");

function score(lead) {
  let s = 0;
  if (lead.website)                                    s += 20;
  if (lead.website && lead.website.includes("placeholder")) s += 30;
  if (lead.email)                                      s += 20;
  if (lead.business.match(/local|llc|co\b/i))          s += 10;
  if (!lead.lastContact)                               s += 20;
  return Math.min(s, 100);
}

function run() {
  const leads = getLeads();
  leads.forEach(l => { l.score = score(l); });
  saveLeads(leads);
  console.log("[scoringAgent] ✓ scored", leads.length, "leads");
}

module.exports = { run };
if (require.main === module) run();
