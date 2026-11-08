#!/usr/bin/env node
/** Read-only AlmaLinux/DirectAdmin staging preflight. No secrets, writes or restarts. */
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import dns from "node:dns/promises";
import tls from "node:tls";

const frontendPort = Number(process.env.ACADEMY_FRONTEND_PORT ?? 3004);
const backendPort = Number(process.env.ACADEMY_BACKEND_PORT ?? 5002);
const domain = process.env.ACADEMY_DOMAIN ?? "academy.titanzero.io";

function probe(command, args) {
  try {
    return { ok: true, text: execFileSync(command, args, { encoding: "utf8", timeout: 6000, stdio: ["ignore", "pipe", "pipe"] }).trim() };
  } catch (error) {
    return { ok: false, text: error.code === "ENOENT" ? "not installed" : `unavailable (${error.status ?? error.code ?? "unknown"})` };
  }
}

function certificate(host) {
  return new Promise((resolve) => {
    const socket = tls.connect({ host, port: 443, servername: host, rejectUnauthorized: true, timeout: 6000 });
    let settled = false;
    const finish = (detail) => {
      if (!settled) { settled = true; socket.destroy(); resolve(detail); }
    };
    socket.once("secureConnect", () => finish({ valid: true, authorized: socket.authorized }));
    socket.once("error", (error) => finish({ valid: false, error: error.code ?? "certificate verification failed" }));
    socket.once("timeout", () => finish({ valid: false, error: "TLS timeout" }));
  });
}

const report = {
  hostname: domain,
  runtime: process.version,
  ports: { frontendPort, backendPort },
  portCheck: {},
  database: probe("pg_isready", ["-h", "127.0.0.1", "-p", "5432"]),
  postgresClient: probe("psql", ["--version"]),
  docker: probe("docker", ["--version"]),
  paths: {
    fieldExists: existsSync("/home/admin/apps/ai-fsm"),
    deskExists: existsSync("/home/admin/apps/desk"),
    academyExists: existsSync("/home/admin/apps/academy"),
    directAdminExists: existsSync("/usr/local/directadmin"),
  },
};
if (![frontendPort, backendPort].every(n => Number.isSafeInteger(n) && n > 0 && n <= 65535) || frontendPort === backendPort) {
  console.error("ACADEMY_FRONTEND_PORT and ACADEMY_BACKEND_PORT must be distinct valid ports");
  process.exitCode = 2;
} else {
  const ss = probe("ss", ["-H", "-lnt"]);
  if (ss.ok) {
    for (const port of [frontendPort, backendPort]) {
      // Handles IPv4 and IPv6 listening addresses, but not container-only ports.
      report.portCheck[String(port)] = ss.text.split("\n").some(line => {
        const localAddress = line.trim().split(/\s+/)[3] ?? "";
        return localAddress.slice(localAddress.lastIndexOf(":") + 1) === String(port);
      }) ? "OCCUPIED" : "not listening (verify Docker as well)";
    }
  } else report.portCheck = { warning: "ss unavailable; port ownership not checked" };
}
try {
  const addresses = await dns.lookup(domain, { all: true });
  report.dns = [...new Set(addresses.map(a => a.address))];
} catch (error) { report.dns = `unresolved (${error.code ?? "lookup failed"})`; }
report.https = await certificate(domain);
console.log(JSON.stringify(report, null, 2));
if (Object.values(report.portCheck).includes("OCCUPIED")) process.exitCode = 1;
