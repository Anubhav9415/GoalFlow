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
    if (!['manager', 'admin', 'hr'].includes(profile.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Get org analytics
    const { data: analytics } = await supabase.rpc('get_org_analytics')

    // Get at-risk goals with employee info
    const { data: atRiskGoals } = await supabase
      .from('goals')
      .select('*, employee:profiles!goals_employee_id_fkey(full_name, department, initials:full_name)')
      .eq('status', 'approved')
      .order('created_at', { ascending: false })

    // Filter at-risk based on checkins
    const { data: atRiskCheckins } = await supabase
      .from('checkins')
      .select('*, goal:goals(*, employee:profiles!goals_employee_id_fkey(full_name, department))')
      .eq('progress_status', 'at_risk')
      .eq('is_submitted', true)
      .limit(10)

    // Department completion stats
    const { data: deptGoals } = await supabase
      .from('goals')
      .select('employee:profiles!goals_employee_id_fkey(department), status')
      .not('employee.department', 'is', null)

    const deptMap: Record<string, { total: number; completed: number }> = {}
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    deptGoals?.forEach((g: any) => {
      const emp = Array.isArray(g.employee) ? g.employee[0] : g.employee
      const dept = emp?.department
      if (!dept) return
      if (!deptMap[dept]) deptMap[dept] = { total: 0, completed: 0 }
      deptMap[dept].total++
      if (g.status === 'approved') deptMap[dept].completed++
    })

    const departmentCompletion = Object.entries(deptMap).map(([dept, data]) => ({
      department: dept,
      completion: data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0,
      goals: data.total,
    }))

    // Audit logs (latest 20)
    const { data: auditLogs } = await supabase
      .from('audit_logs')
      .select('*, changed_by_profile:profiles!audit_logs_changed_by_fkey(full_name, role)')
      .order('created_at', { ascending: false })
      .limit(20)

    return NextResponse.json({
      analytics: analytics || {},
      atRiskGoals: atRiskCheckins || [],
      auditLogs: auditLogs || [],
      departmentCompletion,
      monthlyTrend: [], // Would need time-series data
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
