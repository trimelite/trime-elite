"use strict";
const { read, write } = require("../agents/logger");

function getMeetings() { return read("calendar.json") ?? []; }

function addMeeting({ client, date, status = "scheduled" }) {
  const meetings = getMeetings();
  meetings.unshift({ client, date, status, ts: new Date().toISOString() });
  write("calendar.json", meetings);
  return meetings[0];
}

function updateMeeting(client, date, patch) {
  const meetings = getMeetings();
  const m = meetings.find(x => x.client === client && x.date === date);
  if (m) Object.assign(m, patch);
  write("calendar.json", meetings);
}

module.exports = { getMeetings, addMeeting, updateMeeting };
