#!/usr/bin/env node
const axios = require("axios");
const fs = require("fs");
const path = require("path");

const endpoints = JSON.parse(
  fs.readFileSync(path.join(__dirname, "coverage.endpoints.json"), "utf8"),
);

function normalizeBase(url) {
  const fallback = "http://localhost:8080/api";
  if (!url) return fallback;
  let trimmed = url.replace(/\/+$/, "");
  if (trimmed.endsWith("/api")) return trimmed;
  return `${trimmed}/api`;
}

const base = normalizeBase(process.env.API_BASE || process.env.VITE_API_URL);
const auth = process.env.AUTH_BEARER || null;
const timeout = Number(process.env.COVERAGE_TIMEOUT || 8000);

function sampleForParam(name) {
  const lower = name.toLowerCase();
  if (lower.includes("id") || lower.includes("id")) return "1";
  if (lower.includes("token")) return "tmp-token";
  if (lower.includes("tracking")) return "TRK12345";
  if (lower.includes("phone")) return "+237600000000";
  if (lower.includes("amount")) return "100";
  return "test";
}

async function callEndpoint(ep) {
  // build path
  let p = ep.path;
  const matches = [...p.matchAll(/\{([^}]+)\}/g)].map((m) => m[1]);
  matches.forEach((k) => {
    p = p.replace(`{${k}}`, encodeURIComponent(sampleForParam(k)));
  });

  const url = `${base.replace(/\/api$/, "")}${p.startsWith("/") ? p : "/" + p}`;

  const config = { timeout };
  if (auth) config.headers = { Authorization: `Bearer ${auth}` };

  try {
    let res;
    switch (ep.method) {
      case "GET":
      case "DELETE":
        res = await axios.request({ url, method: ep.method, ...config });
        break;
      default:
        // send a minimal JSON body
        res = await axios.request({
          url,
          method: ep.method,
          data: { _test: true },
          headers: {
            "Content-Type": "application/json",
            ...(config.headers || {}),
          },
          timeout,
        });
    }
    return { ok: true, status: res.status, data: res.data };
  } catch (err) {
    if (err.response) {
      return {
        ok: false,
        status: err.response.status,
        data: err.response.data,
      };
    }
    return { ok: false, status: 0, error: String(err.message || err) };
  }
}

async function run() {
  console.log(`API Coverage runner base=${base}`);
  const results = [];
  for (const ep of endpoints) {
    process.stdout.write(`Calling ${ep.method} ${ep.path} ... `);
    // throttle a bit

    const r = await callEndpoint(ep);
    results.push({ id: ep.id, method: ep.method, path: ep.path, result: r });
    if (r.ok) console.log(`OK ${r.status}`);
    else console.log(`FAIL ${r.status || "ERR"}`);
  }

  const total = results.length;
  const success = results.filter((r) => r.result.ok).length;
  const failures = results.filter((r) => !r.result.ok).length;

  console.log("\n--- Summary ---");
  console.log(`Total endpoints: ${total}`);
  console.log(`Successes: ${success}`);
  console.log(`Failures: ${failures}`);

  const failedList = results.filter((r) => !r.result.ok).slice(0, 50);
  if (failedList.length) {
    console.log("\nFailed endpoints (sample):");
    failedList.forEach((f) => {
      console.log(
        `- ${f.method} ${f.path} -> ${f.result.status} ${f.result.error ? f.result.error : ""}`,
      );
    });
  }

  // write report
  const out = { base, summary: { total, success, failures }, details: results };
  fs.writeFileSync(
    path.join(__dirname, "coverage.report.json"),
    JSON.stringify(out, null, 2),
    "utf8",
  );
  console.log(`\nReport written to scripts/coverage.report.json`);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
