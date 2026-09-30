import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getUser()

  if (error || !data?.user) {
    return NextResponse.json({ status: 'unauthorized' }, { status: 401 })
  }

  return NextResponse.json({ status: 'ok', user: data.user.id })
}
