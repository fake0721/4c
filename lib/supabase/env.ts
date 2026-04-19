const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const LOG_BUCKET = process.env.NEXT_PUBLIC_SUPABASE_LOG_BUCKET ?? "logs";

export function hasSupabaseEnv() {
  return Boolean(SUPABASE_URL && SUPABASE_KEY);
}

export function getSupabaseEnv() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL and a public Supabase key.",
    );
  }

  return {
    url: SUPABASE_URL,
    anonKey: SUPABASE_KEY,
    siteUrl: SITE_URL,
    logBucket: LOG_BUCKET,
  };
}
