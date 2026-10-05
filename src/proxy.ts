import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

function withSessionCookies(target: NextResponse, source: NextResponse) {
  source.cookies.getAll().forEach((c) => target.cookies.set(c))
  return target
}

export async function proxy(request: NextRequest) {
  const { response, user } = await updateSession(request)
  const { pathname } = request.nextUrl
  const isLoginPage = pathname === '/login' || pathname.startsWith('/login/')

  if (!user && !isLoginPage) {
    if (pathname.startsWith('/api/')) {
      return withSessionCookies(
        NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
        response,
      )
    }
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.search = ''
    return withSessionCookies(NextResponse.redirect(url), response)
  }

  if (user && (isLoginPage || pathname === '/')) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    url.search = ''
    return withSessionCookies(NextResponse.redirect(url), response)
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
