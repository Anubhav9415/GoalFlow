import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!url || !key) {
  console.error("Missing URL or KEY")
  process.exit(1)
}

const supabase = createClient(url, key)

async function test() {
  const { data, error } = await supabase.from('organizations').insert({
    name: 'test_api',
    slug: 'test-api-1',
    employee_password: '1',
    manager_password: '2',
    hr_password: '3',
    admin_password: '4'
  }).select()

  console.log("Insert result:", { data, error })
}

test()
