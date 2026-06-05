import { auth } from '@clerk/nextjs/server'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { checkin_id, manager_rating, manager_feedback } = body

    if (!checkin_id || !manager_rating) {
      return NextResponse.json({ error: 'checkin_id and manager_rating are required' }, { status: 400 })
    }

    const supabase = await createClient()

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, role, full_name')
      .eq('clerk_user_id', userId)
      .single()

    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    if (!['manager', 'admin', 'hr'].includes(profile.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { data, error } = await supabase
      .from('checkins')
      .update({
        manager_rating,
        manager_feedback: manager_feedback || null,
        is_reviewed: true,
      })
      .eq('id', checkin_id)
      .select('*, goal:goals(*), employee:profiles!checkins_employee_id_fkey(*)')
      .single()

    if (error) throw error

    // Audit log
    await supabase.from('audit_logs').insert({
      entity_type: 'checkin',
      entity_id: checkin_id,
      action: 'reviewed',
      changed_by: profile.id,
      new_value: { manager_rating, manager_feedback },
      description: `Check-in reviewed by ${profile.full_name}`,
    })

    // Notify employee
    if (data.employee_id) {
      await supabase.from('notifications').insert({
        user_id: data.employee_id,
        title: 'Check-in Reviewed',
        message: `${profile.full_name} has reviewed your check-in for "${data.goal?.title || 'a goal'}" — Rating: ${manager_rating}/5`,
        type: 'checkin_reviewed',
        metadata: { checkin_id, rating: manager_rating },
      })
    }

    return NextResponse.json(data)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
