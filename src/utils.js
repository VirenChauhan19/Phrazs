export function money(value) {
  const n = Number(value) || 0;
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export function ratingLabel(item) {
  return item.rating ? `${item.rating.toFixed(1)} (${item.reviews || 0})` : "New";
}

// Returns a YYYY-MM-DD string for "today" so date pickers can't book the past.
export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function prettyDate(iso) {
  if (!iso) return "";
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
}

// Inclusive number of days between two YYYY-MM-DD strings (min 1).
// "2026-06-01" → "2026-06-03" returns 3.
export function dayCount(startISO, endISO) {
  if (!startISO) return 1;
  const start = new Date(`${startISO}T00:00:00`);
  const end = new Date(`${endISO || startISO}T00:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 1;
  const diff = Math.round((end - start) / 86400000) + 1;
  return Math.max(1, diff);
}

// Returns an array of YYYY-MM-DD strings from start to end, inclusive.
export function dateRange(startISO, endISO) {
  const days = dayCount(startISO, endISO);
  const out = [];
  const cursor = new Date(`${startISO}T00:00:00`);
  for (let i = 0; i < days; i += 1) {
    out.push(cursor.toISOString().slice(0, 10));
    cursor.setDate(cursor.getDate() + 1);
  }
  return out;
}

// Adds a whole number of days to a YYYY-MM-DD string.
export function addDays(iso, days) {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}
