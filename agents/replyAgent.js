"use strict";
const { getLeads, saveLeads } = require("./leadAgent");
const { write } = require("./logger");

// Call this with parsed inbound reply data.
// In production, wire to IMAP polling or webhook.
function classifyReply(text) {
  const t = text.toLowerCase();
  if (/yes|interested|tell me more|sounds good|more info/i.test(t)) return "qualified";
  if (/not interested|unsubscribe|stop|remove/i.test(t))            return "closed-lost";
  return "pending";
}

function processReply({ business, replyText }) {
  const leads      = getLeads();
  const lead       = leads.find(l => l.business === business);
  const classified = classifyReply(replyText ?? "");
  const entry      = { business, classified, ts: new Date().toISOString() };

  if (lead) {
    lead.status = classified;
    if (classified === "qualified")   lead.dealStage = "qualified";
    if (classified === "closed-lost") lead.dealStage = "none";
    saveLeads(leads);
  }

  const { write: w } = require("./logger");
  const existing = require("./logger").read("replies.json") ?? [];
  existing.unshift(entry);
  w("replies.json", existing.slice(0, 200));
  return classified;
}

function run() {
  // Placeholder: no inbound source wired yet
  console.log("[replyAgent] ✓ standing by — wire inbound replies to processReply()");
  const { read } = require("./logger");
  if (!read("replies.json")) write("replies.json", []);
}

const { write } = require("./logger");

module.exports = { processReply, run };
if (require.main === module) run();
