const BASE = import.meta.env.VITE_API_URL || "";

async function post(path, body) {
  const res = await fetch(BASE + path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json();
}

export const sendChat = (text, context) => post("/api/chat", { text, context });
export const getSummary = (transcript, context) => post("/api/summary", { transcript, context });

export async function getOrders() {
  const res = await fetch(BASE + "/api/orders");
  return res.json();
}
