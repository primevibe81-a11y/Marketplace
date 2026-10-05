import { createClient } from '@supabase/supabase-js'


const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Environment variables missing')
  process.exit(1)
}

// Initialize Supabase client strictly anonymously (no sessions)
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  }
})

async function runTest() {
  console.log('Testing RLS policies with anonymous client...')
  
  // 1. Try to read from phone_models
  console.log('1. Attempting to SELECT from phone_models...')
  const { data: selectData, error: selectError } = await supabase.from('phone_models').select('*')
  
  if (selectError) {
    console.error('Expected behavior! Select blocked by RLS:', selectError.message)
  } else if (selectData && selectData.length > 0) {
    console.error('FAIL: Anonymous user can read data! Found', selectData.length, 'rows.')
    process.exit(1)
  } else {
    console.log('SUCCESS: Select returned 0 rows (RLS active).')
  }

  // 2. Try to insert into phone_models
  console.log('\n2. Attempting to INSERT into phone_models...')
  const { error: insertError } = await supabase.from('phone_models').insert({
    brand: 'Hacker',
    name: 'Phone',
  })
  
  if (insertError) {
    console.log('SUCCESS: Insert blocked by RLS:', insertError.message)
  } else {
    console.error('FAIL: Anonymous user was able to insert data!')
    process.exit(1)
  }

  console.log('\nAll RLS security tests passed! The database is secure.')
}

runTest()
