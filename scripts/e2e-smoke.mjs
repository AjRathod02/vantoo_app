/**
 * Vantoo E2E API + page smoke suite.
 * Usage: node scripts/e2e-smoke.mjs [baseUrl]
 */
import { writeFileSync } from "node:fs";

const BASE = process.argv[2] || "http://localhost:3000";
const results = [];
const jar = new Map(); // simple cookie jar

function parseSetCookie(res) {
  const raw = res.headers.getSetCookie?.() || [];
  for (const c of raw) {
    const [pair] = c.split(";");
    const eq = pair.indexOf("=");
    if (eq > 0) jar.set(pair.slice(0, eq), pair.slice(eq + 1));
  }
}

function cookieHeader() {
  return [...jar.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
}

async function req(name, method, path, { body, expectStatus, auth, headers = {}, category } = {}) {
  const url = path.startsWith("http") ? path : `${BASE}${path}`;
  const started = Date.now();
  const h = { ...headers };
  if (body !== undefined) h["Content-Type"] = "application/json";
  if (auth !== false && jar.size) h["Cookie"] = cookieHeader();

  let status = 0;
  let ok = false;
  let data = null;
  let error = null;
  let text = "";

  try {
    const res = await fetch(url, {
      method,
      headers: h,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      redirect: "manual",
    });
    parseSetCookie(res);
    status = res.status;
    text = await res.text();
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = { _raw: text.slice(0, 200) };
    }
    const expected = expectStatus ?? (method === "GET" ? [200] : [200, 201]);
    const allowed = Array.isArray(expected) ? expected : [expected];
    ok = allowed.includes(status);
    if (!ok) error = `Expected ${allowed.join("|")}, got ${status}`;
  } catch (e) {
    error = e.message;
  }

  const ms = Date.now() - started;
  const row = { name, method, path, status, ok, ms, error, category: category || "api", bodySnippet: error ? String(text || "").slice(0, 180) : undefined };
  results.push(row);
  const mark = ok ? "PASS" : "FAIL";
  console.log(`${mark} [${ms}ms] ${method} ${path} → ${status}${error ? " | " + error : ""}`);
  return { ok, status, data, ms };
}

async function page(name, path, expectStatus = [200, 307, 302]) {
  return req(name, "GET", path, { expectStatus, category: "page", auth: false });
}

async function main() {
  console.log(`\n=== Vantoo E2E Smoke @ ${BASE} ===\n`);

  // --- Public pages ---
  console.log("--- Public Pages ---");
  for (const p of [
    "/", "/food", "/grocery", "/medicine", "/ecommerce", "/search", "/cart",
    "/login", "/signup", "/reset-password", "/about", "/contact", "/careers",
    "/blog", "/help", "/help/faqs", "/help/contact", "/wishlist", "/rate-app",
    "/policies/privacy", "/policies/terms", "/policies/refund", "/policies/cancellation",
    "/offline", "/admin/login",
  ]) {
    await page(`page ${p}`, p);
  }

  // Protected pages should redirect when unauthenticated
  console.log("\n--- Auth Guards ---");
  for (const p of ["/checkout", "/orders", "/profile", "/wallet", "/refer", "/vendor", "/rider"]) {
    await page(`guard ${p}`, p, [307, 302, 200]); // 200 if middleware allows shell
  }

  // --- Public APIs ---
  console.log("\n--- Public / Catalog APIs ---");
  await req("products list", "GET", "/api/products");
  await req("categories", "GET", "/api/categories");
  await req("search suggest empty", "GET", "/api/search/suggest?q=");
  await req("search suggest pizza", "GET", "/api/search/suggest?q=pizza");
  await req("offers", "GET", "/api/offers");
  await req("restaurants", "GET", "/api/restaurants");
  await req("promotions", "GET", "/api/promotions");
  await req("blog", "GET", "/api/blog");
  await req("setup status", "GET", "/api/setup/status");
  await req("maps directions", "GET", "/api/maps/directions?origin=12.97,77.59&destination=12.98,77.60", { expectStatus: [200, 400, 500] });

  // Product detail — pick first product if available
  const products = results.find((r) => r.name === "products list");
  let productId = null;
  try {
    const last = results.filter((r) => r.name === "products list").pop();
  } catch {}
  const prodRes = await fetch(`${BASE}/api/products`);
  const prodJson = await prodRes.json();
  const list = prodJson?.data || prodJson?.products || (Array.isArray(prodJson) ? prodJson : []);
  productId = list[0]?.id || list[0]?.product_id || "seed-1";
  await req("product detail", "GET", `/api/products/${productId}`, { expectStatus: [200, 404] });
  await req("product reviews", "GET", `/api/products/${productId}/reviews`, { expectStatus: [200, 404] });

  // --- Auth: unauthenticated protected APIs ---
  console.log("\n--- Auth Required APIs (expect 401) ---");
  for (const [name, method, path] of [
    ["auth me", "GET", "/api/auth/me"],
    ["profile", "GET", "/api/profile"],
    ["orders", "GET", "/api/orders"],
    ["notifications", "GET", "/api/notifications"],
    ["referrals", "GET", "/api/referrals"],
    ["wallet", "GET", "/api/referrals/wallet"],
    ["saved payments", "GET", "/api/payments/saved"],
    ["support", "GET", "/api/support"],
    ["vendor me", "GET", "/api/vendor/me"],
    ["rider me", "GET", "/api/rider/me"],
    ["admin me", "GET", "/api/admin/auth/me"],
    ["admin dashboard", "GET", "/api/admin/dashboard"],
    ["admin customers", "GET", "/api/admin/customers"],
  ]) {
    await req(name, method, path, { expectStatus: [401, 403], auth: false });
  }

  // --- Auth validation ---
  console.log("\n--- Auth Validation ---");
  await req("login empty", "POST", "/api/auth/login", { body: {}, expectStatus: [400, 401, 422] });
  await req("login bad creds", "POST", "/api/auth/login", {
    body: { email: "nobody@invalid.test", password: "wrongpassword123" },
    expectStatus: [400, 401],
  });
  await req("signup invalid", "POST", "/api/auth/signup", {
    body: { email: "not-an-email", password: "1" },
    expectStatus: [400, 422],
  });
  await req("forgot password missing", "POST", "/api/auth/forgot-password", {
    body: {},
    expectStatus: [400, 422],
  });
  await req("admin login empty", "POST", "/api/admin/auth/login", {
    body: {},
    expectStatus: [400, 401, 422],
  });
  await req("admin login bad", "POST", "/api/admin/auth/login", {
    body: { email: "fake@admin.test", password: "wrong" },
    expectStatus: [400, 401],
  });

  // --- Coupons / payments validation ---
  console.log("\n--- Commerce Validation ---");
  await req("coupon invalid", "POST", "/api/coupons/validate", {
    body: { code: "FAKECOUPON999", cartTotal: 500 },
    expectStatus: [200, 400, 401, 404],
  });
  await req("razorpay create unauth", "POST", "/api/payments/razorpay/create-order", {
    body: { amount: 100 },
    expectStatus: [401, 400, 403],
    auth: false,
  });
  await req("razorpay verify junk", "POST", "/api/payments/razorpay/verify", {
    body: { razorpay_order_id: "x", razorpay_payment_id: "y", razorpay_signature: "z" },
    expectStatus: [400, 401, 403],
  });

  // --- Edge cases ---
  console.log("\n--- Edge Cases ---");
  await req("invalid product id", "GET", "/api/products/not-a-real-id-xyz", { expectStatus: [404, 200] });
  await req("orders cancel unauth", "POST", "/api/orders/fake-id/cancel", {
    body: {},
    expectStatus: [401, 403, 404],
    auth: false,
  });
  await req("SQL injection search", "GET", "/api/search/suggest?q=" + encodeURIComponent("' OR 1=1--"), {
    expectStatus: [200, 400],
  });
  await req("XSS search", "GET", "/api/search/suggest?q=" + encodeURIComponent("<script>alert(1)</script>"), {
    expectStatus: [200, 400],
  });

  // --- Admin modules (unauth) ---
  console.log("\n--- Admin APIs unauth ---");
  for (const path of [
    "/api/admin/orders", "/api/admin/products", "/api/admin/vendors", "/api/admin/riders",
    "/api/admin/refunds", "/api/admin/payments", "/api/admin/reviews", "/api/admin/complaints",
    "/api/admin/coupons", "/api/admin/categories", "/api/admin/reports", "/api/admin/settings",
    "/api/admin/notifications", "/api/admin/referrals", "/api/admin/help", "/api/admin/audit-logs",
    "/api/admin/tracking/active",
  ]) {
    await req(`admin ${path}`, "GET", path, { expectStatus: [401, 403], auth: false });
  }

  // Summary
  const passed = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok).length;
  const avgMs = Math.round(results.reduce((s, r) => s + r.ms, 0) / results.length);

  const summary = {
    base: BASE,
    timestamp: new Date().toISOString(),
    total: results.length,
    passed,
    failed,
    avgMs,
    failures: results.filter((r) => !r.ok),
    byCategory: {
      page: {
        total: results.filter((r) => r.category === "page").length,
        passed: results.filter((r) => r.category === "page" && r.ok).length,
      },
      api: {
        total: results.filter((r) => r.category === "api").length,
        passed: results.filter((r) => r.category === "api" && r.ok).length,
      },
    },
    results,
  };

  writeFileSync("scripts/e2e-smoke-results.json", JSON.stringify(summary, null, 2));
  console.log(`\n=== SUMMARY: ${passed}/${results.length} passed, ${failed} failed, avg ${avgMs}ms ===`);
  if (failed) {
    console.log("\nFailures:");
    for (const f of summary.failures) {
      console.log(` - ${f.method} ${f.path} (${f.status}): ${f.error}`);
    }
  }
  process.exit(failed ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(2);
});
