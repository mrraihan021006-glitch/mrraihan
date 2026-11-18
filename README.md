# mrraihan — Full-Stack Portfolio & Admin CMS (Cloudflare Workers/Pages + D1 + Cloudinary)

## Fixed Deployment Setup (Why previous build failed & how it is fixed)
Cloudflare's `npx wrangler deploy` requires `[assets] directory = "./public"` and `main = "worker.js"` in `wrangler.toml`. Both are now pre-configured in the root of this repository!

## Active Routes
- `/` — Main Graphic, Brand, 3D & Motion Portfolio
- `/admin` (or double-click `raihan.` logo) — Secret Full-Site Admin Panel
- `/tool/{name}` (e.g. `/tool/adobe-tracker`, `/tool/purepixel-ai`, `/tool/rankflow-studio`) — Sub-path Tools
- `/work/{slug}` (e.g. `/work/monolith-brand`, `/work/swiss-exhibition`) — Full Case Study Views
- `/gallery` & `/gallery/{category}` — Full Cloudinary Visual Archive
