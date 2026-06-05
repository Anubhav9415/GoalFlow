import { auth } from '@clerk/nextjs/server'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const supabase = await createClient()

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, manager_id, full_name')
      .eq('clerk_user_id', userId)
      .single()

    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

    // Get all draft goals for this user
    const { data: draftGoals } = await supabase
      .from('goals')
      .select('id, title, weightage')
      .eq('employee_id', profile.id)
      .eq('status', 'draft')

    if (!draftGoals || draftGoals.length === 0) {
      return NextResponse.json({ error: 'No draft goals to submit' }, { status: 400 })
    }

    // Validate total weightage = 100
    const totalWeightage = draftGoals.reduce((sum, g) => sum + Number(g.weightage), 0)
    if (totalWeightage !== 100) {
      return NextResponse.json(
        { error: `Total weightage must equal 100% (currently ${totalWeightage}%)` },
        { status: 400 }
      )
    }

    // Update all draft goals to pending
    const goalIds = draftGoals.map(g => g.id)
    const { error } = await supabase
      .from('goals')
      .update({ status: 'pending', is_locked: true, submitted_at: new Date().toISOString() })
      .in('id', goalIds)

    if (error) throw error

    // Create audit logs for each goal
    const auditEntries = draftGoals.map(g => ({
      entity_type: 'goal' as const,
      entity_id: g.id,
      action: 'submitted' as const,
      changed_by: profile.id,
      old_value: { status: 'draft' },
      new_value: { status: 'pending' },
      description: `Goal "${g.title}" submitted for approval`,
    }))
    await supabase.from('audit_logs').insert(auditEntries)

    // Notify the manager if one exists
    if (profile.manager_id) {
      await supabase.from('notifications').insert({
        user_id: profile.manager_id,
        title: 'Goals Submitted for Approval',
        message: `${profile.full_name} has submitted ${draftGoals.length} goal(s) for your review.`,
        type: 'goal_submitted',
        metadata: { employee_id: profile.id, goal_count: draftGoals.length },
      })
    }

    return NextResponse.json({ count: draftGoals.length })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
