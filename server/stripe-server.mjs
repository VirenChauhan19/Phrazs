import { createServer } from "node:http";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import PHRAZS_DATA from "../src/data.js";
import PHRAZS_MEDIA from "../src/media.js";
import { ADMIN_DATA } from "./admin-data.mjs";

const PORT = Number(process.env.PORT || process.env.STRIPE_SERVER_PORT || 4242);
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || loadEnv("STRIPE_SECRET_KEY");
const SITE_URL = (process.env.SITE_URL || loadEnv("SITE_URL") || "http://127.0.0.1:5173").replace(/\/$/, "");
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || loadEnv("ADMIN_EMAIL") || "").trim().toLowerCase();
const ADMIN_PASSCODE = process.env.ADMIN_PASSCODE || loadEnv("ADMIN_PASSCODE");
const ADMIN_SESSION_SECRET = process.env.ADMIN_SESSION_SECRET || loadEnv("ADMIN_SESSION_SECRET") || randomBytes(32).toString("hex");
const ADMIN_COOKIE = "phrazs_admin_session";
const ADMIN_TTL_MS = 1000 * 60 * 60 * 8;
const PLATFORM_RATE = 0.15;
const dynamicRecords = { bookings: [], payments: [], payouts: [], calendar: [], users: [], inquiries: [] };

function loadEnv(name) {
  const file = resolve(process.cwd(), ".env");
  if (!existsSync(file)) return "";
  const line = readFileSync(file, "utf8")
    .split(/\r?\n/)
    .find((entry) => entry.trim().startsWith(`${name}=`));
  return line ? line.slice(line.indexOf("=") + 1).trim().replace(/^["']|["']$/g, "") : "";
}

function json(res, status, body, extraHeaders = {}) {
  res.writeHead(status, {
    "Access-Control-Allow-Origin": new URL(SITE_URL).origin,
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
    ...extraHeaders,
  });
  res.end(JSON.stringify(body));
}

async function readJson(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
}

function cookieHeader(value, maxAgeSeconds) {
  // When the frontend and API live on different domains (e.g. GitHub Pages -> Render),
  // the session cookie is third-party and must be SameSite=None; Secure to be sent at all.
  const isHttps = SITE_URL.startsWith("https://");
  const sameSite = isHttps ? "None" : "Lax";
  const secure = isHttps ? "; Secure" : "";
  return `${ADMIN_COOKIE}=${value}; Path=/; HttpOnly; SameSite=${sameSite}; Max-Age=${maxAgeSeconds}${secure}`;
}

function sign(payload) {
  return createHmac("sha256", ADMIN_SESSION_SECRET).update(payload).digest("base64url");
}

function createAdminToken(email) {
  const payload = Buffer.from(JSON.stringify({ email, exp: Date.now() + ADMIN_TTL_MS })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

function readCookies(req) {
  return Object.fromEntries(
    String(req.headers.cookie || "")
      .split(";")
      .map((part) => part.trim().split("="))
      .filter(([key, value]) => key && value)
  );
}

function safeEqual(a, b) {
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));
  return left.length === right.length && timingSafeEqual(left, right);
}

function getAdminSession(req) {
  const token = readCookies(req)[ADMIN_COOKIE];
  if (!token || !token.includes(".")) return null;
  const [payload, signature] = token.split(".");
  if (!safeEqual(signature, sign(payload))) return null;
  try {
    const session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (!session.email || Date.now() > session.exp) return null;
    return session;
  } catch {
    return null;
  }
}

function requireAdmin(req, res) {
  const session = getAdminSession(req);
  if (!session) {
    json(res, 401, { error: "Admin authentication required." });
    return null;
  }
  return session;
}

function cents(value) {
  return Math.max(50, Math.round((Number(value) || 0) * 100));
}

function round2(n) {
  return Math.round((Number(n) || 0) * 100) / 100;
}

function priceBooking(rate, hours) {
  const subtotal = round2((Number(rate) || 0) * (Number(hours) || 0));
  const platformFee = round2(subtotal * PLATFORM_RATE);
  const hostPayout = round2(subtotal - platformFee);
  const total = round2(subtotal + platformFee);
  return { subtotal, platformFee, hostPayout, total };
}

function nextSequentialId(prefix, items, fallbackStart) {
  let max = fallbackStart - 1;
  items.forEach((item) => {
    const match = String(item.id || "").match(new RegExp(`^${prefix}-(\\d+)$`));
    if (match) max = Math.max(max, Number(match[1]));
  });
  return `${prefix}-${max + 1}`;
}

function addHoursToTime(time, hours) {
  const [h, m] = String(time || "09:00").split(":").map((v) => Number(v) || 0);
  const endH = Math.min(h + (Number(hours) || 0), 23);
  return `${String(endH).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

async function stripeRequest(path, params) {
  if (!STRIPE_SECRET_KEY) {
    throw new Error("Missing STRIPE_SECRET_KEY. Add it to .env or your hosting environment.");
  }

  const response = await fetch(`https://api.stripe.com/v1${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params,
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || "Stripe request failed.");
  return data;
}

async function getStripeSession(sessionId) {
  if (!STRIPE_SECRET_KEY) {
    throw new Error("Missing STRIPE_SECRET_KEY. Add it to .env or your hosting environment.");
  }
  const response = await fetch(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`, {
    headers: { Authorization: `Bearer ${STRIPE_SECRET_KEY}` },
  });
  const session = await response.json();
  if (!response.ok) throw new Error(session.error?.message || "Unable to retrieve Stripe Checkout session.");
  return session;
}

async function createCheckoutSession(req, res) {
  const { listing, booking, pricing, returnBase } = await readJson(req);
  if (!listing?.id || !listing?.title || !booking?.guestEmail || !pricing?.total) {
    json(res, 400, { error: "Missing listing, booking, or pricing details." });
    return;
  }

  // The frontend sends its own base URL so redirects land on the exact page the
  // user is on (e.g. a GitHub Pages project path like /Phrazs/), not just SITE_URL.
  const base = String(returnBase || SITE_URL).replace(/\/$/, "");

  // Demo mode: no Stripe key configured yet. Simulate a successful Stripe Checkout
  // session so the booking + payment flow works end to end. Replace by setting
  // STRIPE_SECRET_KEY to switch to real Stripe charges.
  if (!STRIPE_SECRET_KEY) {
    const id = `cs_demo_${randomBytes(12).toString("hex")}`;
    json(res, 200, { id, url: `${base}/#/checkout-success?session_id=${id}` });
    return;
  }

  const params = new URLSearchParams();
  params.set("mode", "payment");
  params.set("customer_email", booking.guestEmail);
  params.set("success_url", `${base}/#/checkout-success?session_id={CHECKOUT_SESSION_ID}`);
  params.set("cancel_url", `${base}/#/listing/${encodeURIComponent(listing.id)}`);
  params.set("line_items[0][quantity]", "1");
  params.set("line_items[0][price_data][currency]", "usd");
  params.set("line_items[0][price_data][unit_amount]", String(cents(pricing.total)));
  params.set("line_items[0][price_data][product_data][name]", `Phrazs booking - ${listing.title}`.slice(0, 250));
  params.set(
    "line_items[0][price_data][product_data][description]",
    `${booking.days} day${booking.days === 1 ? "" : "s"} · ${booking.totalHours} hours · ${booking.startDate}`.slice(0, 250)
  );
  params.set("metadata[listing_id]", listing.id);
  params.set("metadata[listing_title]", listing.title.slice(0, 500));
  params.set("metadata[guest_email]", booking.guestEmail);
  params.set("metadata[start_date]", booking.startDate);
  params.set("metadata[end_date]", booking.endDate);
  params.set("metadata[total_hours]", String(booking.totalHours));
  params.set("metadata[subtotal]", String(pricing.subtotal));
  params.set("metadata[platform_fee]", String(pricing.platformFee));
  params.set("metadata[host_payout]", String(pricing.hostPayout));

  const session = await stripeRequest("/checkout/sessions", params);
  json(res, 200, { id: session.id, url: session.url });
}

async function retrieveCheckoutSession(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const sessionId = url.searchParams.get("session_id");
  if (!sessionId || !sessionId.startsWith("cs_")) {
    json(res, 400, { error: "Missing or invalid Stripe Checkout session id." });
    return;
  }

  // Demo mode: confirm the simulated session as paid (stateless, so it survives
  // server restarts). The booking details are carried in the browser, not here.
  if (!STRIPE_SECRET_KEY || sessionId.startsWith("cs_demo_")) {
    json(res, 200, {
      id: sessionId,
      status: "complete",
      payment_status: "paid",
      payment_intent: `pi_demo_${sessionId.slice(-12)}`,
      metadata: {},
    });
    return;
  }

  const session = await getStripeSession(sessionId);
  json(res, 200, {
    id: session.id,
    status: session.status,
    payment_status: session.payment_status,
    amount_total: session.amount_total,
    currency: session.currency,
    customer_email: session.customer_details?.email || session.customer_email,
    payment_intent: session.payment_intent,
    metadata: session.metadata || {},
  });
}

async function recordPaidBooking(req, res) {
  const { listingId, form, stripeSessionId, stripePaymentIntent } = await readJson(req);
  const listing = PHRAZS_DATA.listings.find((item) => item.id === listingId);
  if (!listing || !form?.email || !form?.name || !stripeSessionId) {
    json(res, 400, { error: "Missing booking details." });
    return;
  }

  const session = await getStripeSession(stripeSessionId);
  if (session.payment_status !== "paid") {
    json(res, 402, { error: "Stripe has not marked this checkout session as paid." });
    return;
  }
  if (dynamicRecords.payments.some((payment) => payment.stripeSessionId === stripeSessionId)) {
    json(res, 200, { ok: true, duplicate: true });
    return;
  }

  const schedule = (Array.isArray(form.schedule) && form.schedule.length
    ? form.schedule
    : [{ date: form.date, hours: Math.max(1, Number(form.hours) || 1) }]
  ).map((day) => ({ date: day.date, hours: Math.max(1, Number(day.hours) || 1) }));
  const startTime = form.startTime || "09:00";
  const date = schedule[0].date;
  const endDate = schedule[schedule.length - 1].date;
  const days = schedule.length;
  const hours = schedule.reduce((sum, day) => sum + day.hours, 0);
  const crew = Math.max(1, Number(form.crew) || 1);
  const endTime = addHoursToTime(startTime, schedule[schedule.length - 1].hours);
  const { subtotal, platformFee, hostPayout, total } = priceBooking(listing.price, hours);
  const bookingId = nextSequentialId("bk", [...dynamicRecords.bookings, ...ADMIN_DATA.bookings], 1100);
  const paymentId = nextSequentialId("pay", [...dynamicRecords.payments, ...ADMIN_DATA.payments], 9100);
  const payoutId = nextSequentialId("po", [...dynamicRecords.payouts, ...ADMIN_DATA.payouts], 7100);

  const booking = {
    id: bookingId,
    propertyId: listing.id,
    property: listing.title,
    guest: form.name,
    guestEmail: form.email,
    host: listing.host || "Phrazs host",
    start: `${date} ${startTime}`,
    end: `${endDate} ${endTime}`,
    date,
    endDate,
    days,
    hours,
    schedule,
    crew,
    status: "Confirmed",
    paymentStatus: "Paid",
    subtotal,
    platformFee,
    hostPayout,
    total,
    notes: form.notes?.trim() || `Booked online for ${listing.title}.`,
    createdAt: new Date().toISOString(),
    source: "stripe-checkout",
  };
  const payment = {
    id: paymentId,
    bookingId,
    processor: "Stripe",
    method: "Stripe Checkout",
    cardBrand: "Stripe",
    last4: String(session.payment_intent || stripePaymentIntent || stripeSessionId).slice(-4),
    gross: total,
    fees: round2(total * 0.029 + 0.3),
    net: round2(total - (total * 0.029 + 0.3)),
    refunded: 0,
    status: "Captured",
    capturedAt: new Date().toISOString().slice(0, 16).replace("T", " "),
    stripeSessionId,
    stripePaymentIntent: session.payment_intent || stripePaymentIntent || "",
  };
  const payoutDate = new Date(`${endDate}T00:00:00`);
  payoutDate.setDate(payoutDate.getDate() + 2);
  const payout = {
    id: payoutId,
    host: booking.host,
    bookingId,
    amount: hostPayout,
    status: "Scheduled",
    payoutDate: payoutDate.toISOString().slice(0, 10),
  };
  const calendar = schedule.map((day) => ({
    date: day.date,
    property: listing.title,
    status: "Booked",
    bookingId,
    time: `${startTime}-${addHoursToTime(startTime, day.hours)}`,
  }));

  dynamicRecords.bookings.unshift(booking);
  dynamicRecords.payments.unshift(payment);
  dynamicRecords.payouts.unshift(payout);
  dynamicRecords.calendar.unshift(...calendar);
  if (!dynamicRecords.users.some((user) => user.email.toLowerCase() === form.email.toLowerCase())) {
    dynamicRecords.users.unshift({
      id: nextSequentialId("usr", [...dynamicRecords.users, ...ADMIN_DATA.users], 100),
      name: form.name,
      email: form.email,
      role: "Guest",
      status: "Active",
      joined: new Date().toISOString().slice(0, 10),
      bookings: 1,
      lifetimeValue: total,
    });
  }

  json(res, 200, { ok: true, bookingId });
}

async function adminLogin(req, res) {
  const { email, passcode } = await readJson(req);
  if (!ADMIN_EMAIL || !ADMIN_PASSCODE) {
    json(res, 500, { error: "Admin credentials are not configured on the server." });
    return;
  }
  const emailOk = String(email || "").trim().toLowerCase() === ADMIN_EMAIL;
  const passOk = safeEqual(passcode || "", ADMIN_PASSCODE);
  if (!emailOk || !passOk) {
    json(res, 401, { error: "That email or passcode is not authorized for admin access." });
    return;
  }
  json(res, 200, { isAdmin: true, email: ADMIN_EMAIL }, { "Set-Cookie": cookieHeader(createAdminToken(ADMIN_EMAIL), ADMIN_TTL_MS / 1000) });
}

function adminSession(req, res) {
  const session = getAdminSession(req);
  json(res, 200, { isAdmin: !!session, email: session?.email || "" });
}

function adminLogout(req, res) {
  json(res, 200, { ok: true }, { "Set-Cookie": cookieHeader("", 0) });
}

function adminData(req, res) {
  if (!requireAdmin(req, res)) return;
  json(res, 200, {
    data: {
      brand: PHRAZS_DATA.brand,
      legal: PHRAZS_DATA.legal,
      source: ADMIN_DATA.source,
      bookingStructure: ADMIN_DATA.bookingStructure,
    },
    media: PHRAZS_MEDIA,
    listings: PHRAZS_DATA.listings,
    hosts: PHRAZS_DATA.hosts,
    inquiries: [...dynamicRecords.inquiries, ...ADMIN_DATA.inquiries],
    bookings: [...dynamicRecords.bookings, ...ADMIN_DATA.bookings],
    payments: [...dynamicRecords.payments, ...ADMIN_DATA.payments],
    payouts: [...dynamicRecords.payouts, ...ADMIN_DATA.payouts],
    calendar: [...dynamicRecords.calendar, ...ADMIN_DATA.calendar],
    users: [...dynamicRecords.users, ...ADMIN_DATA.users],
  });
}

createServer(async (req, res) => {
  try {
    if (req.method === "OPTIONS") {
      json(res, 204, {});
    } else if (req.method === "POST" && req.url === "/api/admin/login") {
      await adminLogin(req, res);
    } else if (req.method === "GET" && req.url === "/api/admin/session") {
      adminSession(req, res);
    } else if (req.method === "POST" && req.url === "/api/admin/logout") {
      adminLogout(req, res);
    } else if (req.method === "GET" && req.url === "/api/admin/data") {
      adminData(req, res);
    } else if (req.method === "POST" && req.url === "/api/bookings/record") {
      await recordPaidBooking(req, res);
    } else if (req.method === "POST" && req.url === "/api/create-checkout-session") {
      await createCheckoutSession(req, res);
    } else if (req.method === "GET" && req.url.startsWith("/api/checkout-session")) {
      await retrieveCheckoutSession(req, res);
    } else {
      json(res, 404, { error: "Not found" });
    }
  } catch (error) {
    json(res, 500, { error: error.message || "Unexpected server error." });
  }
}).listen(PORT, () => {
  console.log(`Phrazs API server listening on http://127.0.0.1:${PORT}`);
});
