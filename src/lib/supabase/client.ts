import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  let supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim();
  if (supabaseUrl && !supabaseUrl.startsWith('http')) {
    supabaseUrl = 'https://' + supabaseUrl;
  }
  // Auto-correct if they only pasted the Project ID
  if (supabaseUrl && !supabaseUrl.includes('.supabase.co') && !supabaseUrl.includes('localhost')) {
    const projectId = supabaseUrl.replace('https://', '').replace('http://', '');
    supabaseUrl = `https://${projectId}.supabase.co`;
  }

  return createBrowserClient(
    supabaseUrl,
    (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim()
  )
}
