import { auth } from '@clerk/nextjs/server'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const supabase = await createClient()

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('clerk_user_id', userId)
      .single()

    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

    let query = supabase
      .from('goals')
      .select('*, employee:profiles!goals_employee_id_fkey(*), decided_by_profile:profiles!goals_decided_by_fkey(*)')
      .order('submitted_at', { ascending: false })

    if (profile.role === 'manager') {
      // Manager sees goals from their direct reports
      const { data: reports } = await supabase
        .from('profiles')
        .select('id')
        .eq('manager_id', profile.id)

      const reportIds = reports?.map(r => r.id) || []
      query = query.in('employee_id', reportIds)
    }
    // admin/hr see all goals with pending/approved/rejected status

    query = query.in('status', ['pending', 'approved', 'rejected'])

    const { data, error } = await query
    if (error) throw error
    return NextResponse.json(data)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { goal_id, action, comment } = body

    if (!goal_id || !action) {
      return NextResponse.json({ error: 'goal_id and action are required' }, { status: 400 })
    }
    if (action === 'reject' && !comment) {
      return NextResponse.json({ error: 'Comment is required when rejecting' }, { status: 400 })
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

    const newStatus = action === 'approve' ? 'approved' : 'rejected'

    const { data, error } = await supabase
      .from('goals')
      .update({
        status: newStatus,
        manager_comment: comment || null,
        decided_at: new Date().toISOString(),
        decided_by: profile.id,
        is_locked: action === 'approve',
      })
      .eq('id', goal_id)
      .eq('status', 'pending')
      .select('*, employee:profiles!goals_employee_id_fkey(*)')
      .single()

    if (error) throw error
    if (!data) return NextResponse.json({ error: 'Goal not found or already decided' }, { status: 404 })

    // Audit log
    await supabase.from('audit_logs').insert({
      entity_type: 'goal',
      entity_id: goal_id,
      action: action === 'approve' ? 'approved' : 'rejected',
      changed_by: profile.id,
      old_value: { status: 'pending' },
      new_value: { status: newStatus, comment },
      description: `Goal "${data.title}" ${newStatus} by ${profile.full_name}`,
    })

    // Notify the employee
    await supabase.from('notifications').insert({
      user_id: data.employee_id,
      title: action === 'approve' ? 'Goal Approved' : 'Goal Returned',
      message: action === 'approve'
        ? `Your goal "${data.title}" has been approved by ${profile.full_name}.`
        : `Your goal "${data.title}" has been returned by ${profile.full_name}. Feedback: ${comment}`,
      type: action === 'approve' ? 'goal_approved' : 'goal_rejected',
      metadata: { goal_id, decided_by: profile.id },
    })

    return NextResponse.json(data)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
