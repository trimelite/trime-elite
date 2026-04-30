"use strict";
const { read, write } = require("../agents/logger");

function getClients() { return read("clients.json") ?? []; }

function addClient({ name, business, service, monthlyValue, startDate }) {
  const clients = getClients();
  clients.unshift({ name, business, service, monthlyValue, startDate: startDate ?? new Date().toISOString(), ts: new Date().toISOString() });
  write("clients.json", clients);
  return clients[0];
}

module.exports = { getClients, addClient };
