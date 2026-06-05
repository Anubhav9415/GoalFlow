import { auth } from '@clerk/nextjs/server'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('goals')
      .select('*, employee:profiles!goals_employee_id_fkey(*), cycle:performance_cycles(*)')
      .eq('id', id)
      .single()

    if (error) throw error
    return NextResponse.json(data)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const body = await request.json()
    const supabase = await createClient()

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('clerk_user_id', userId)
      .single()

    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

    // Get current goal state for audit
    const { data: oldGoal } = await supabase
      .from('goals')
      .select('*')
      .eq('id', id)
      .single()

    if (!oldGoal) return NextResponse.json({ error: 'Goal not found' }, { status: 404 })

    // Build update object — only include fields that are provided
    const updateData: Record<string, unknown> = {}
    if (body.title !== undefined) updateData.title = body.title
    if (body.description !== undefined) updateData.description = body.description
    if (body.thrust_area !== undefined) updateData.thrust_area = body.thrust_area
    if (body.uom_type !== undefined) updateData.uom_type = body.uom_type
    if (body.target_value !== undefined) updateData.target_value = body.target_value
    if (body.weightage !== undefined) updateData.weightage = body.weightage
    if (body.status !== undefined) updateData.status = body.status
    if (body.is_locked !== undefined) updateData.is_locked = body.is_locked
    if (body.manager_comment !== undefined) updateData.manager_comment = body.manager_comment

    const { data, error } = await supabase
      .from('goals')
      .update(updateData)
      .eq('id', id)
      .select('*, employee:profiles!goals_employee_id_fkey(*)')
      .single()

    if (error) throw error

    // Audit log
    await supabase.from('audit_logs').insert({
      entity_type: 'goal',
      entity_id: id,
      action: body.is_locked === false ? 'unlocked' : 'updated',
      changed_by: profile.id,
      old_value: { status: oldGoal.status, is_locked: oldGoal.is_locked },
      new_value: updateData,
      description: body.is_locked === false
        ? `Goal "${oldGoal.title}" unlocked by ${profile.role}`
        : `Goal "${oldGoal.title}" updated`,
    })

    return NextResponse.json(data)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const supabase = await createClient()

    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('clerk_user_id', userId)
      .single()

    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

    // Only allow deleting own draft goals
    const { data: goal } = await supabase
      .from('goals')
      .select('employee_id, status, title')
      .eq('id', id)
      .single()

    if (!goal) return NextResponse.json({ error: 'Goal not found' }, { status: 404 })
    if (goal.employee_id !== profile.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    if (goal.status !== 'draft') return NextResponse.json({ error: 'Can only delete draft goals' }, { status: 400 })

    const { error } = await supabase.from('goals').delete().eq('id', id)
    if (error) throw error

    // Audit log
    await supabase.from('audit_logs').insert({
      entity_type: 'goal',
      entity_id: id,
      action: 'deleted',
      changed_by: profile.id,
      old_value: { title: goal.title },
      description: `Goal "${goal.title}" deleted`,
    })

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
