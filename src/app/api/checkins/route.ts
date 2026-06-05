import { auth } from '@clerk/nextjs/server'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role')

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, role, organization_id')
      .eq('clerk_user_id', userId)
      .single()

    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

    const effectiveRole = role || profile.role

    if (effectiveRole === 'employee') {
      // Employee: get their approved goals with check-in data
      const { data: goals } = await supabase
        .from('goals')
        .select('*, checkins(*)')
        .eq('employee_id', profile.id)
        .eq('status', 'approved')
        .order('created_at', { ascending: false })

      return NextResponse.json(goals)
    } else {
      // Manager/Admin/HR: get team check-ins
      let checkinQuery = supabase
        .from('checkins')
        .select('*, goal:goals(*), employee:profiles!inner(*)')
        .eq('is_submitted', true)
        .eq('employee.organization_id', profile.organization_id)
        .order('created_at', { ascending: false })

      if (effectiveRole === 'manager') {
        const { data: reports } = await supabase
          .from('profiles')
          .select('id')
          .eq('manager_id', profile.id)

        const reportIds = reports?.map(r => r.id) || []
        checkinQuery = checkinQuery.in('employee_id', reportIds)
      }

      const { data, error } = await checkinQuery
      if (error) throw error
      return NextResponse.json(data)
    }
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
    const supabase = await createClient()

    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('clerk_user_id', userId)
      .single()

    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

    // Upsert check-in (unique on goal_id + quarter)
    const { data, error } = await supabase
      .from('checkins')
      .upsert(
        {
          goal_id: body.goal_id,
          employee_id: profile.id,
          quarter: body.quarter,
          actual_value: body.actual_value || null,
          progress_status: body.progress_status || null,
          self_note: body.self_note || null,
          is_submitted: true,
        },
        { onConflict: 'goal_id,quarter' }
      )
      .select('*, goal:goals(*)')
      .single()

    if (error) throw error

    // Audit log
    await supabase.from('audit_logs').insert({
      entity_type: 'checkin',
      entity_id: data.id,
      action: 'submitted',
      changed_by: profile.id,
      new_value: { actual_value: body.actual_value, progress_status: body.progress_status },
      description: `Check-in submitted for goal "${data.goal?.title || 'Unknown'}"`,
    })

    // Notify manager
    const { data: empProfile } = await supabase
      .from('profiles')
      .select('manager_id, full_name')
      .eq('id', profile.id)
      .single()

    if (empProfile?.manager_id) {
      await supabase.from('notifications').insert({
        user_id: empProfile.manager_id,
        title: 'Check-in Submitted',
        message: `${empProfile.full_name} submitted a check-in for "${data.goal?.title || 'a goal'}".`,
        type: 'checkin_due',
        metadata: { checkin_id: data.id, goal_id: body.goal_id },
      })
    }

    return NextResponse.json(data)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
