import { auth } from '@clerk/nextjs/server'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import fs from 'fs'

function logError(msg: string, err?: any) {
  try {
    fs.appendFileSync('onboard-error.log', `${new Date().toISOString()} - ${msg} - ${err ? JSON.stringify(err) : ''}\n`)
  } catch (e) {}
}

function generatePassword() {
  return Math.random().toString(36).slice(-8)
}

function generateSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.random().toString(36).slice(-4)
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      logError('Unauthorized - No userId')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action, orgName, orgSlug, password, full_name, email, avatar_url } = body

    const supabase = await createClient()
    let data;

    if (action === 'create') {
      if (!orgName) {
        logError('Org name required')
        return NextResponse.json({ error: 'Organization name is required' }, { status: 400 })
      }

      // Create Organization
      const slug = generateSlug(orgName)
      const empPwd = generatePassword()
      const mgrPwd = generatePassword()
      const hrPwd = generatePassword()
      const adminPwd = generatePassword()

      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: orgName,
          slug,
          employee_password: empPwd,
          manager_password: mgrPwd,
          hr_password: hrPwd,
          admin_password: adminPwd
        })
        .select()
        .single()

      if (orgError) {
        logError('Failed to create organization', orgError)
        return NextResponse.json({ error: 'Failed to create organization: ' + orgError.message }, { status: 400 })
      }

      // Upsert profile as admin for this new org
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .upsert(
          {
            clerk_user_id: userId,
            full_name: full_name || '',
            email: email || '',
            role: 'admin',
            organization_id: orgData.id,
            avatar_url: avatar_url || null,
          },
          { onConflict: 'clerk_user_id' }
        )
        .select()
        .single()

      if (profileError) {
        logError('Failed to create profile', profileError)
        return NextResponse.json({ error: 'Failed to create profile: ' + profileError.message }, { status: 400 })
      }

      data = { profile: profileData, organization: orgData }
    } else if (action === 'join') {
      if (!orgSlug || !password) {
        logError('Slug and password required')
        return NextResponse.json({ error: 'Slug and password are required' }, { status: 400 })
      }

      // Find Organization
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .eq('slug', orgSlug)
        .single()

      if (orgError || !orgData) {
        logError('Organization not found', orgError)
        return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
      }

      // Determine role based on password
      let role = null
      if (password === orgData.employee_password) role = 'employee'
      else if (password === orgData.manager_password) role = 'manager'
      else if (password === orgData.hr_password) role = 'hr'
      else if (password === orgData.admin_password) role = 'admin'

      if (!role) {
        logError('Invalid password')
        return NextResponse.json({ error: 'Invalid password for this organization' }, { status: 401 })
      }

      // Upsert profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .upsert(
          {
            clerk_user_id: userId,
            full_name: full_name || '',
            email: email || '',
            role: role,
            organization_id: orgData.id,
            avatar_url: avatar_url || null,
          },
          { onConflict: 'clerk_user_id' }
        )
        .select()
        .single()

      if (profileError) {
        logError('Failed to join profile', profileError)
        return NextResponse.json({ error: 'Failed to join profile: ' + profileError.message }, { status: 400 })
      }

      data = { profile: profileData, organization: orgData }
    } else {
      logError('Invalid action: ' + action)
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    return NextResponse.json(data)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    logError('Caught exception', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
