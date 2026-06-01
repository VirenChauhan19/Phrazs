const API_BASE = (import.meta.env.VITE_API_BASE || import.meta.env.VITE_STRIPE_API_BASE || "").replace(/\/$/, "");

export function apiUrl(path) {
  return `${API_BASE}${path}`;
}

// Render's free tier sleeps when idle and takes ~30-50s to wake. Fire a cheap
// request early (e.g. when the booking modal opens) so the API is warm by the
// time the user actually checks out. Fire-and-forget; failures are ignored.
export function warmApi() {
  try {
    fetch(apiUrl("/api/admin/session"), { credentials: "include" }).catch(() => {});
  } catch {
    /* ignore */
  }
}

export async function apiRequest(path, options = {}) {
  let response;
  try {
    response = await fetch(apiUrl(path), {
      ...options,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    });
  } catch {
    throw new Error("Admin backend is not reachable. Start the API server or set VITE_API_BASE to your deployed backend.");
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Request failed.");
  return data;
}
