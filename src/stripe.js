import { apiUrl } from "./api.js";
const PENDING_KEY = "phrazs_pending_checkout_v1";
const COMPLETED_KEY = "phrazs_completed_checkout_sessions_v1";

function readJson(key, fallback) {
  try {
    const raw = sessionStorage.getItem(key) || localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function savePendingCheckout(payload) {
  try {
    sessionStorage.setItem(PENDING_KEY, JSON.stringify(payload));
  } catch {
    /* ignore storage failures; Stripe checkout can still proceed */
  }
}

export function getPendingCheckout() {
  return readJson(PENDING_KEY, null);
}

export function clearPendingCheckout() {
  try {
    sessionStorage.removeItem(PENDING_KEY);
  } catch {
    /* ignore */
  }
}

export function hasCompletedCheckout(sessionId) {
  const completed = readJson(COMPLETED_KEY, []);
  return completed.includes(sessionId);
}

export function markCheckoutCompleted(sessionId) {
  try {
    const completed = readJson(COMPLETED_KEY, []);
    if (!completed.includes(sessionId)) {
      localStorage.setItem(COMPLETED_KEY, JSON.stringify([sessionId, ...completed].slice(0, 50)));
    }
  } catch {
    /* ignore */
  }
}

export async function createCheckoutSession(payload) {
  // Tell the backend where to send the user back to — the exact origin + path
  // they're on (handles GitHub Pages project paths like /Phrazs/).
  const returnBase = `${window.location.origin}${window.location.pathname}`;
  const response = await fetch(apiUrl("/api/create-checkout-session"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...payload, returnBase }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Unable to start Stripe Checkout.");
  return data;
}

export async function getCheckoutSession(sessionId) {
  const response = await fetch(apiUrl(`/api/checkout-session?session_id=${encodeURIComponent(sessionId)}`));
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Unable to verify Stripe Checkout.");
  return data;
}

export async function recordPaidBooking(payload) {
  const response = await fetch(apiUrl("/api/bookings/record"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Unable to save the paid booking on the backend.");
  return data;
}
