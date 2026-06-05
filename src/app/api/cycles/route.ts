import { auth } from '@clerk/nextjs/server'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('performance_cycles')
      .select('*')
      .order('start_date', { ascending: false })

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

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('clerk_user_id', userId)
      .single()

    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    if (!['admin', 'hr'].includes(profile.role)) {
      return NextResponse.json({ error: 'Only admin/HR can manage cycles' }, { status: 403 })
    }

    // If setting this cycle as active, deactivate others
    if (body.is_active) {
      await supabase
        .from('performance_cycles')
        .update({ is_active: false })
        .eq('is_active', true)
    }

    let data, error
    if (body.id) {
      // Update existing
      const result = await supabase
        .from('performance_cycles')
        .update({
          name: body.name,
          start_date: body.start_date,
          end_date: body.end_date,
          is_active: body.is_active ?? false,
        })
        .eq('id', body.id)
        .select()
        .single()
      data = result.data
      error = result.error
    } else {
      // Create new
      const result = await supabase
        .from('performance_cycles')
        .insert({
          name: body.name,
          start_date: body.start_date,
          end_date: body.end_date,
          is_active: body.is_active ?? false,
          created_by: profile.id,
        })
        .select()
        .single()
      data = result.data
      error = result.error
    }

    if (error) throw error

    // Audit log
    await supabase.from('audit_logs').insert({
      entity_type: 'cycle',
      entity_id: data.id,
      action: body.id ? 'updated' : 'created',
      changed_by: profile.id,
      new_value: { name: data.name, is_active: data.is_active },
      description: `Cycle "${data.name}" ${body.id ? 'updated' : 'created'}`,
    })

    return NextResponse.json(data)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
