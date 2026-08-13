/**
 * platformClient — Phase 26: Supabase platform layer (scaffold).
 *
 * The full cloud platform (accounts, cloud saves, shareable trial links,
 * community cases, live spectating) is designed but DORMANT until activated,
 * because the project currently runs local-only by owner policy.
 *
 * ACTIVATION (see docs/PLATFORM_SETUP.md):
 *   1. Create a Supabase project and apply supabase/migrations/0001_init.sql
 *   2. npm install --legacy-peer-deps @supabase/supabase-js
 *   3. Add to .env.local:
 *        VITE_SUPABASE_URL=https://<project>.supabase.co
 *        VITE_SUPABASE_ANON_KEY=<anon key>
 *   4. Replace the stub in createPlatformClient() below with:
 *        import { createClient } from '@supabase/supabase-js'
 *        return createClient(url, anonKey)
 *
 * Until then every call is a typed no-op, and isPlatformEnabled() gates all
 * platform UI so nothing half-configured ever renders.
 */

export function isPlatformEnabled(): boolean {
  return Boolean(
    import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY
  );
}

export interface PlatformTrialRecord {
  id: string;
  title: string;
  shareSlug: string | null;
  isPublic: boolean;
  createdAt: string;
}

export function createPlatformClient(): null {
  if (!isPlatformEnabled()) return null;
  // Stub until @supabase/supabase-js is installed at activation time.
  console.warn(
    'Platform env vars are set but the Supabase client is not installed yet — see docs/PLATFORM_SETUP.md'
  );
  return null;
}
