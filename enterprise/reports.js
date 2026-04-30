"use strict";
const { read, write } = require("../agents/logger");
const { totalRevenue } = require("./payments");

function generate() {
  const leads    = read("leads.json")    ?? [];
  const payments = read("payments.json") ?? [];
  const closed = leads.filter(l => l.client);
  const report = {
    totalLeads:      leads.length,
    contacted:       leads.filter(l => ["contacted","follow-up","qualified","closed-lost"].includes(l.status)).length,
    qualified:       leads.filter(l => l.dealStage === "qualified").length,
    meeting:         leads.filter(l => l.dealStage === "meeting").length,
    closed:          closed.length,
    closedLost:      leads.filter(l => l.status === "closed-lost").length,
    conversionRate:  leads.length ? `${((closed.length / leads.length) * 100).toFixed(1)}%` : "0%",
    activeDeals:     leads.filter(l => l.dealStage !== "none" && !l.client).length,
    totalRevenue:    totalRevenue(),
    ts:              new Date().toISOString(),
  };
  write("reports.json", report);
  return report;
}

module.exports = { generate };
if (require.main === module) console.log(generate());
