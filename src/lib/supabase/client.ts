import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  let supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim();
  if (supabaseUrl && !supabaseUrl.startsWith('http')) {
    supabaseUrl = 'https://' + supabaseUrl;
  }

  return createBrowserClient(
    supabaseUrl,
    (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim()
  )
}
