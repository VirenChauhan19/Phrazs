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
