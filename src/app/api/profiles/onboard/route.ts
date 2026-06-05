import { auth, clerkClient } from '@clerk/nextjs/server'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// POST /api/profiles/onboard — called right after sign-up to set role + create profile
export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { role, full_name, email, department, avatar_url } = body

    const validRoles = ['employee', 'manager', 'admin', 'hr']
    if (!role || !validRoles.includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    const supabase = await createClient()

    // Upsert profile with role
    const { data, error } = await supabase
      .from('profiles')
      .upsert(
        {
          clerk_user_id: userId,
          full_name: full_name || '',
          email: email || '',
          role,
          department: department || null,
          avatar_url: avatar_url || null,
        },
        { onConflict: 'clerk_user_id' }
      )
      .select()
      .single()

    if (error) {
      console.error('Supabase upsert error:', error)
      return NextResponse.json({ error: error.message, details: error }, { status: 400 })
    }

    // Update Clerk user's public metadata so the frontend knows their role
    const client = await clerkClient()
    await client.users.updateUserMetadata(userId, {
      publicMetadata: { role }
    })

    // Log onboarding
    const { error: auditError } = await supabase.from('audit_logs').insert({
      entity_type: 'profile',
      entity_id: data.id,
      action: 'created',
      changed_by: data.id,
      new_value: { role, department },
      description: `${full_name} joined as ${role}`,
    })

    if (auditError) {
      console.error('Audit log insert error:', auditError)
      // We still return data because the profile was created
    }

    return NextResponse.json(data)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
