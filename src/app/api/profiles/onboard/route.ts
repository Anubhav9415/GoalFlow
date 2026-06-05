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
    let data;
    try {
      const result = await supabase
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

      if (result.error) {
        return NextResponse.json({ error: 'Supabase DB Error: ' + result.error.message }, { status: 400 })
      }
      data = result.data;
    } catch (e: any) {
      return NextResponse.json({ error: 'Supabase Network Error: ' + e.message }, { status: 500 })
    }

    // Update Clerk user's public metadata so the frontend knows their role
    try {
      const client = await clerkClient()
      await client.users.updateUserMetadata(userId, {
        publicMetadata: { role }
      })
    } catch (e: any) {
      console.error('Failed to update Clerk user metadata:', e)
      // Do not block onboarding if Clerk fails (fallback to database-backed role resolution)
    }

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
