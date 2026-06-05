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
      .select('*')
      .eq('clerk_user_id', userId)
      .single()

    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

    const isManagerOrAbove = ['manager', 'admin', 'hr'].includes(profile.role)

    let stats
    if (isManagerOrAbove) {
      const { data } = await supabase.rpc('get_team_stats', { p_manager_id: profile.id })
      stats = data
    } else {
      const { data } = await supabase.rpc('get_dashboard_stats', { p_profile_id: profile.id })
      stats = data
    }

    // Get recent goals
    let goalsQuery = supabase
      .from('goals')
      .select('*, employee:profiles!goals_employee_id_fkey(full_name, department)')
      .order('updated_at', { ascending: false })
      .limit(5)

    if (profile.role === 'employee') {
      goalsQuery = goalsQuery.eq('employee_id', profile.id)
    } else if (profile.role === 'manager') {
      const { data: reports } = await supabase
        .from('profiles')
        .select('id')
        .eq('manager_id', profile.id)
      const reportIds = (reports?.map(r => r.id) || [])
      reportIds.push(profile.id)
      goalsQuery = goalsQuery.in('employee_id', reportIds)
    }

    const { data: recentGoals } = await goalsQuery

    // Get quarterly progress data
    const { data: checkinProgress } = await supabase
      .from('checkins')
      .select('quarter, progress_status')
      .eq('is_submitted', true)
      .order('quarter')

    // Compute quarterly averages
    const quarterMap: Record<string, number[]> = {}
    checkinProgress?.forEach(c => {
      if (!quarterMap[c.quarter]) quarterMap[c.quarter] = []
      const val = c.progress_status === 'completed' ? 100
        : c.progress_status === 'on_track' ? 70
        : c.progress_status === 'at_risk' ? 40 : 0
      quarterMap[c.quarter].push(val)
    })

    const quarterlyProgress = ['Q1', 'Q2', 'Q3', 'Q4'].map(q => ({
      quarter: q,
      progress: quarterMap[q]
        ? Math.round(quarterMap[q].reduce((a, b) => a + b, 0) / quarterMap[q].length)
        : 0,
    }))

    return NextResponse.json({
      profile,
      stats: stats || {},
      recentGoals: recentGoals || [],
      quarterlyProgress,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
