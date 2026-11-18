// Cloudflare Worker + Static Assets Entrypoint for mrraihan
// Bound to Cloudflare D1: raihan_portfolio_db (212050f4-a269-4c14-a6d2-9b3f21431902)
// Bound to Cloudinary: dbkmg0oia

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Cache-Control": "no-store, no-cache, must-revalidate",
      "Content-Type": "application/json"
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    if (path.startsWith("/api/")) {
      try {
        if (!env.DB) {
          return new Response(JSON.stringify({ error: "D1 binding DB not found" }), { status: 500, headers: corsHeaders });
        }

        // Ensure both portfolio_state and media_assets tables exist in raihan_portfolio_db
        await env.DB.prepare(
          "CREATE TABLE IF NOT EXISTS portfolio_state (id INTEGER PRIMARY KEY CHECK (id = 1), state_json TEXT NOT NULL, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP)"
        ).run();
        await env.DB.prepare(
          "CREATE TABLE IF NOT EXISTS media_assets (id TEXT PRIMARY KEY, filename TEXT, data_url TEXT NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)"
        ).run();

        // 1. GET /api/state -> Return live global state
        if (path === "/api/state" && request.method === "GET") {
          const row = await env.DB.prepare("SELECT state_json FROM portfolio_state WHERE id = 1").first();
          if (!row || !row.state_json) {
            return new Response(JSON.stringify({ empty: true }), { headers: corsHeaders });
          }
          return new Response(row.state_json, { headers: corsHeaders });
        }

        // 2. POST /api/state -> Save global state to D1
        if (path === "/api/state" && request.method === "POST") {
          const bodyText = await request.text();
          await env.DB.prepare(
            "INSERT INTO portfolio_state (id, state_json, updated_at) VALUES (1, ?, CURRENT_TIMESTAMP) ON CONFLICT(id) DO UPDATE SET state_json = excluded.state_json, updated_at = CURRENT_TIMESTAMP"
          )
            .bind(bodyText)
            .run();
          return new Response(JSON.stringify({ ok: true, database: "raihan_portfolio_db" }), { headers: corsHeaders });
        }

        // 3. POST /api/media -> Store uploaded personal/gallery photo in D1 media_assets table & return /api/media/<id> URL
        if (path === "/api/media" && request.method === "POST") {
          const body = await request.json();
          const id = "m_" + Date.now() + "_" + Math.random().toString(36).slice(2, 7);
          await env.DB.prepare("INSERT INTO media_assets (id, filename, data_url) VALUES (?, ?, ?)")
            .bind(id, body.filename || "image.webp", body.dataUrl)
            .run();
          return new Response(JSON.stringify({ ok: true, id: id, url: "/api/media/" + id }), { headers: corsHeaders });
        }

        // 4. GET /api/media/<id> -> Serve uploaded image directly from D1 globally
        if (path.startsWith("/api/media/") && request.method === "GET") {
          const id = path.replace("/api/media/", "");
          const row = await env.DB.prepare("SELECT data_url FROM media_assets WHERE id = ?").bind(id).first();
          if (!row || !row.data_url) {
            return new Response("Image not found", { status: 404 });
          }
          const m = row.data_url.match(/^data:([^;]+);base64,(.+)$/);
          if (m) {
            const mime = m[1];
            const binStr = atob(m[2]);
            const bytes = new Uint8Array(binStr.length);
            for (let i = 0; i < binStr.length; i++) bytes[i] = binStr.charCodeAt(i);
            return new Response(bytes.buffer, {
              headers: {
                "Content-Type": mime,
                "Cache-Control": "public, max-age=31536000, immutable"
              }
            });
          }
          return Response.redirect(row.data_url, 302);
        }

        return new Response(JSON.stringify({ status: "raihan. D1 API online", cloud: env.CLOUDINARY_CLOUD_NAME || "dbkmg0oia" }), {
          headers: corsHeaders
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
      }
    }

    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }
    return new Response("Not found", { status: 404 });
  }
};
