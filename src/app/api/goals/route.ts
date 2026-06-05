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
    const status = searchParams.get('status')

    // Get the current user's profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, role, manager_id, organization_id')
      .eq('clerk_user_id', userId)
      .single()

    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

    let query = supabase
      .from('goals')
      .select('*, employee:profiles!inner(*), cycle:performance_cycles(*)')
      .eq('employee.organization_id', profile.organization_id)
      .order('created_at', { ascending: false })

    const effectiveRole = role || profile.role

    // Filter based on role
    if (effectiveRole === 'employee') {
      query = query.eq('employee_id', profile.id)
    } else if (effectiveRole === 'manager') {
      // Manager sees their direct reports' goals
      const { data: reports } = await supabase
        .from('profiles')
        .select('id')
        .eq('manager_id', profile.id)

      const reportIds = reports?.map(r => r.id) || []
      reportIds.push(profile.id) // Include own goals
      query = query.in('employee_id', reportIds)
    }
    // admin/hr see all goals — no filter

    if (status) {
      query = query.eq('status', status)
    }

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
    const supabase = await createClient()

    // Get the user's profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('clerk_user_id', userId)
      .single()

    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

    // Get active cycle if not specified
    let cycleId = body.cycle_id
    if (!cycleId) {
      const { data: activeCycle } = await supabase
        .from('performance_cycles')
        .select('id')
        .eq('is_active', true)
        .single()
      cycleId = activeCycle?.id || null
    }

    const { data, error } = await supabase
      .from('goals')
      .insert({
        employee_id: profile.id,
        cycle_id: cycleId,
        title: body.title,
        description: body.description || null,
        thrust_area: body.thrust_area || null,
        uom_type: body.uom_type || null,
        target_value: body.target_value || null,
        weightage: body.weightage || 0,
        status: 'draft',
      })
      .select('*, employee:profiles!goals_employee_id_fkey(*)')
      .single()

    if (error) throw error

    // Audit log
    await supabase.from('audit_logs').insert({
      entity_type: 'goal',
      entity_id: data.id,
      action: 'created',
      changed_by: profile.id,
      new_value: { title: data.title, weightage: data.weightage },
      description: `Goal "${data.title}" created`,
    })

    return NextResponse.json(data, { status: 201 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
