"use strict";
const https = require("https");
const { getLeads, saveLeads } = require("./leadAgent");

// Fetches sample public business data from a free open dataset
// Replace URL with a real allowed endpoint when available
function fetchPublicLeads() {
  return new Promise((resolve) => {
    // Placeholder: returns empty — swap in a real public API endpoint
    resolve([]);
  });
}

async function run() {
  try {
    const raw = await fetchPublicLeads();
    if (!raw.length) { console.log("[scraperAgent] no new leads from source"); return; }
    const leads = getLeads();
    const existing = new Set(leads.map(l => l.business));
    let added = 0;
    for (const r of raw) {
      if (!r.business || existing.has(r.business)) continue;
      leads.unshift({ name: r.name ?? "", business: r.business, website: r.website ?? "",
        email: "", status: "new", score: 0, lastContact: null, dealStage: "none", client: false });
      existing.add(r.business);
      added++;
    }
    if (added) saveLeads(leads);
    console.log("[scraperAgent] ✓ added", added, "new leads");
  } catch (e) {
    console.error("[scraperAgent] error:", e.message);
  }
}

module.exports = { run };
if (require.main === module) run();
