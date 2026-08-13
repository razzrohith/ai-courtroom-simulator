# Platform Setup (Supabase) — Activation Guide

The cloud platform layer (accounts, cloud library, shareable trial links,
community cases, usage metering) is scaffolded and dormant. Nothing runs in
the cloud until you follow these steps — the app stays fully functional
local-only without them.

## What's already in the repo
- `supabase/migrations/0001_init.sql` — full schema with row-level security:
  `profiles`, `trials` (replays + share slugs), `community_cases`,
  `usage_events`.
- `src/platform/platformClient.ts` — feature-flagged client stub; every
  platform feature checks `isPlatformEnabled()` first.

## Activation steps (~15 minutes)
1. **Create the project** — supabase.com → New project (free tier is fine).
   The Supabase MCP connection in this workspace can also do it.
2. **Apply the schema** — `supabase db push`, or paste
   `supabase/migrations/0001_init.sql` into the SQL editor, or use the MCP
   `apply_migration`.
3. **Install the client** —
   `npm install --legacy-peer-deps @supabase/supabase-js`
4. **Configure env** — add to `.env.local`:
   ```
   VITE_SUPABASE_URL=https://<project-ref>.supabase.co
   VITE_SUPABASE_ANON_KEY=<anon key>
   ```
5. **Swap the stub** — in `platformClient.ts`, replace the `createPlatformClient`
   body with a real `createClient(url, anonKey)` call (2 lines, noted inline).

## Then build (in order)
1. Auth UI (Supabase email/OTP) + profile row on first login
2. Cloud case library: mirror `saveToLibrary`/`listLibrary` onto `trials`
3. Share links: publish replay → `share_slug` → read-only replay-theater route
4. Community cases: publish/browse/fork `community_cases`
5. Move AI calls to an Edge Function with the key server-side + `usage_events`
   metering (retires localStorage API keys)
6. Live spectating via Realtime channels

## Security notes
- All tables ship with RLS enabled and owner-scoped policies.
- `usage_events` inserts are service-role-only (Edge Function).
- Never put the service-role key in the client.
