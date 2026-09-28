import { createClient } from '@supabase/supabase-js';
const env = (import.meta as unknown as { env: Record<string, string | undefined> }).env ?? {};
const url = env.VITE_SUPABASE_URL;
const key = env.VITE_SUPABASE_PUBLISHABLE_KEY;
export const pilotSupabase = url && key ? createClient(url, key) : null;
