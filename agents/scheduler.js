"use strict";
const { run: runContent }  = require("./contentAgent");
const { run: runLeads }    = require("./leadAgent");
const { run: runScraper }  = require("./scraperAgent");
const { run: runScoring }  = require("./scoringAgent");
const { run: runOutreach } = require("./outreachAgent");
const { run: runFollowup } = require("./followupAgent");
const { run: runReply }    = require("./replyAgent");
const { run: runDeal }     = require("./dealAgent");
const { run: runPoster }   = require("./posterAgent");

const INTERVAL = 86400000;

async function runAll() {
  console.log("[scheduler] ── run start ──", new Date().toISOString());
  await runContent();
  await runScraper();
  runLeads();
  runScoring();
  await runOutreach();
  await runFollowup();
  runReply();
  runDeal();
  runPoster();
  console.log("[scheduler] ── run complete ──");
}

if (!global.__AGENTS_RUNNING__) {
  global.__AGENTS_RUNNING__ = true;
  runAll();
  setInterval(runAll, INTERVAL);
  console.log("[scheduler] started — next run in 24h");
}

module.exports = { runAll };
