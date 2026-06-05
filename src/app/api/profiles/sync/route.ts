import { auth } from '@clerk/nextjs/server'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const supabase = await createClient()

    // Upsert profile — create if not exists, update if exists
    const { data, error } = await supabase
      .from('profiles')
      .upsert(
        {
          clerk_user_id: userId,
          full_name: body.full_name || '',
          email: body.email || '',
          avatar_url: body.avatar_url || null,
        },
        { onConflict: 'clerk_user_id' }
      )
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(data)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
