"use strict";
const { read, write } = require("../agents/logger");

function getPayments() { return read("payments.json") ?? []; }

function addPayment({ client, amount, status = "pending", date }) {
  const payments = getPayments();
  payments.unshift({ client, amount, status, date: date ?? new Date().toISOString(), ts: new Date().toISOString() });
  write("payments.json", payments);
  return payments[0];
}

function totalRevenue() {
  return getPayments().filter(p => p.status === "paid").reduce((s, p) => s + (p.amount ?? 0), 0);
}

module.exports = { getPayments, addPayment, totalRevenue };
