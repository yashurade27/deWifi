// When VITE_API_URL is not set, use an empty string so all /api calls are
// relative to the current host — Vite dev server proxies them to localhost:3000.
// This lets a single ngrok tunnel serve both the UI and the API.
export const API_BASE = import.meta.env.VITE_API_URL ?? "";

interface ApiOptions {
  method?: string;
  body?: unknown;
  token?: string;
}

export async function apiFetch<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const { method = "GET", body, token } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    // Required to bypass ngrok's free-tier browser-warning interstitial
    // Without this, ngrok returns an HTML warning page instead of JSON
    "ngrok-skip-browser-warning": "true",
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Something went wrong.");
  return data as T;
}
