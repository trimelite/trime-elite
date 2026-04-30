"use strict";
const { read } = require("../agents/logger");

function getClients() {
  return (read("leads.json") ?? []).filter(l => l.client === true || l.dealStage === "closed");
}

function getPipeline() {
  return (read("leads.json") ?? []).filter(l => l.dealStage !== "none");
}

module.exports = { getClients, getPipeline };
