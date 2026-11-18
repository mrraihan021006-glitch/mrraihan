export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname;
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Content-Type": "application/json"
  };
  if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    await env.DB.prepare(
      "CREATE TABLE IF NOT EXISTS portfolio_state (id INTEGER PRIMARY KEY CHECK (id = 1), state_json TEXT NOT NULL, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP)"
    ).run();
    if (path === "/api/state" && request.method === "GET") {
      const row = await env.DB.prepare("SELECT state_json FROM portfolio_state WHERE id = 1").first();
      if (!row) return new Response(JSON.stringify({ empty: true }), { headers: corsHeaders });
      return new Response(row.state_json, { headers: corsHeaders });
    }
    if (path === "/api/state" && request.method === "POST") {
      const bodyText = await request.text();
      await env.DB.prepare(
        "INSERT INTO portfolio_state (id, state_json, updated_at) VALUES (1, ?, CURRENT_TIMESTAMP) ON CONFLICT(id) DO UPDATE SET state_json = excluded.state_json, updated_at = CURRENT_TIMESTAMP"
      ).bind(bodyText).run();
      return new Response(JSON.stringify({ ok: true, database: "raihan_portfolio_db" }), { headers: corsHeaders });
    }
    return new Response(JSON.stringify({ status: "ok" }), { headers: corsHeaders });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
}
