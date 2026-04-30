"use strict";
const { spawn, fork } = require("child_process");
const path = require("path");

// Start Next.js
const next = spawn("npx", ["next", "start", "-p", process.env.PORT || "3000"], {
  env: process.env, stdio: "inherit", shell: true,
});

next.on("exit", (code) => { console.error("[start] Next.js exited:", code); process.exit(code ?? 1); });

// Start agent scheduler as a separate process
const scheduler = fork(path.join(__dirname, "agents", "scheduler.js"), [], {
  env: process.env,
  silent: false,
});

scheduler.on("exit", (code) => {
  console.error("[start] Scheduler exited:", code, "— restarting in 10s");
  setTimeout(() => {
    fork(path.join(__dirname, "agents", "scheduler.js"), [], { env: process.env, silent: false });
  }, 10000);
});

console.log("[start] Next.js + agent scheduler running");
