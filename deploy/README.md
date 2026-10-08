# Americas Kickoff 2027 — Registration site

Static site + one serverless function. No build step.

## Deploy
1. Push this folder to a Git repo (or run `npx vercel` inside it).
2. In Vercel: **New Project → Import**. Framework preset: **Other**. Build command: none. Output directory: `.` (root).
3. **Settings → Environment Variables**: add `ANTHROPIC_API_KEY` (required for the concierge chat). Optional: `ANTHROPIC_MODEL`.
4. Deploy. Routes: `/` registration page, `/dashboard` client dashboard.

## Structure
- `index.html` — registration landing page (v4)
- `dashboard.html` — client planning dashboard
- `support.js`, `image-slot.js`, `attendee-map.js` — runtime + components
- `capgemini-save-the-date/assets/` — images
- `api/concierge.js` — concierge proxy (keeps the API key server-side)
- `vercel.json` — clean URLs, caching, noindex headers

## Before going live
- Remove the **Demo** button: set `demoPanel` to `false` (search `"demoPanel"` in index.html → `"default": false`), or keep for client walkthroughs.
- `X-Robots-Tag: noindex` is set — remove it in `vercel.json` if the site should be indexed.
- Registrations, attendee map, dashboard data are **sample/front-end only**; connect a backend (form submit, guest DB) before real invites go out.
- `/dashboard` is public — protect it (Vercel Password Protection or auth) before sharing real data.
- Wallet passes need Apple/Google signing (see handoff notes). Calendar (.ics) downloads work as-is.
- External services used at runtime: Google Fonts, unpkg (d3, topojson), jsDelivr (world-atlas), Open-Meteo (weather).
