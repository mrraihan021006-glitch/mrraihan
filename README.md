# mrraihan — Global Portfolio & Cloud Admin CMS

## Global Save & Image Storage Architecture
- **Global Text & Layout State**: Stored in Cloudflare D1 (`raihan_portfolio_db` / `212050f4-a269-4c14-a6d2-9b3f21431902`) in the `portfolio_state` table (`<20 KB` lightweight tokenized JSON so D1 saves in `<15ms` and never hits SQLite row limits).
- **Personal Photo & Gallery Image Uploads**: Automatically compressed to crisp WebP/JPEG and uploaded to **Cloudinary (`dbkmg0oia`)** AND backed up in Cloudflare D1's dedicated `media_assets` table (`/api/media/<id>`) so uploaded photos persist 100% globally across all devices and reloads!
