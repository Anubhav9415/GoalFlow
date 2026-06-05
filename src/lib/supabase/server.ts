import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  
  let supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim();
  if (supabaseUrl && !supabaseUrl.startsWith('http')) {
    supabaseUrl = 'https://' + supabaseUrl;
  }
  // Auto-correct if they only pasted the Project ID
  if (supabaseUrl && !supabaseUrl.includes('.supabase.co') && !supabaseUrl.includes('localhost')) {
    const projectId = supabaseUrl.replace('https://', '').replace('http://', '');
    supabaseUrl = `https://${projectId}.supabase.co`;
  }

  return createServerClient(
    supabaseUrl,
    (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim(),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}
