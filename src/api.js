// src/api.js
const API_BASE = import.meta.env.VITE_API_BASE || "";

export async function askAI(prompt) {
  const res = await fetch(`${API_BASE}/api/ai`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
  return data.text;
}
