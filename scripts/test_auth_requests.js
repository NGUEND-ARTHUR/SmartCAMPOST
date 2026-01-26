#!/usr/bin/env node
// Simple auth endpoint tester. Usage:
// BASE="http://localhost:8080/api" node scripts/test_auth_requests.js

const BASE = process.env.BASE || process.env.VITE_API_URL || "http://localhost:8080/api";
const headers = { "Content-Type": "application/json" };

async function post(path, body) {
  const url = `${BASE.replace(/\/+$/, "")}${path}`;
  console.log(`POST ${url}`);
  console.log("payload:", body);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
    const text = await res.text();
    console.log(`-> ${res.status} ${res.statusText}`);
    console.log(text ? JSON.parse(text) : "<no body>");
  } catch (err) {
    console.error("request failed:", err.message || err);
  }
}

async function run() {
  console.log("Using base:", BASE);

  // 1) request login OTP
  await post("/auth/login/otp/request", { phone: "+237600000000" });

  // 2) confirm login OTP (replace otp with actual if known)
  await post("/auth/login/otp/confirm", { phone: "+237600000000", otp: "123456" });

  // 3) attempt password login
  await post("/auth/login", { phone: "+237600000000", password: "password123" });

  // 4) request password reset
  await post("/auth/password/reset/request", { phone: "+237600000000" });

  // 5) confirm password reset
  await post("/auth/password/reset/confirm", { phone: "+237600000000", otp: "123456", newPassword: "newpass123" });

  // 6) register (example)
  await post("/auth/register", {
    fullName: "Test User",
    phone: "+237600000001",
    email: "test@example.com",
    preferredLanguage: "EN",
    password: "password123",
    otp: "123456",
  });
}

run();
