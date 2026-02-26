import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  // Refresh session if expired - required for Server Components
  const { data: { session } } = await supabase.auth.getSession()

  const { pathname } = req.nextUrl

  // 1. Protect all /api routes except /api/auth and /api/tenants (creation)
  if (pathname.startsWith('/api')) {
    const isPublicApi = 
      pathname.startsWith('/api/auth') || 
      (pathname === '/api/tenants' && req.method === 'POST')

    if (!session && !isPublicApi) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  // 2. Auth Flow Logic
  const isPublicPage = 
    pathname === '/' || 
    pathname.startsWith('/login') || 
    pathname.startsWith('/signup') ||
    pathname.startsWith('/auth/callback')

  if (!session) {
    if (!isPublicPage) {
      const redirectUrl = req.nextUrl.clone()
      redirectUrl.pathname = '/login'
      return NextResponse.redirect(redirectUrl)
    }
  } else {
    // User is logged in
    const tenantId = req.cookies.get('x-tenant-id')?.value

    if (!tenantId && pathname !== '/onboarding' && !pathname.startsWith('/api') && !pathname.startsWith('/auth')) {
      // Logged in but no tenant selected - force onboarding
      const onboardingUrl = req.nextUrl.clone()
      onboardingUrl.pathname = '/onboarding'
      return NextResponse.redirect(onboardingUrl)
    }

    if (tenantId && pathname === '/onboarding') {
      // Already has a tenant, skip onboarding
      const dashboardUrl = req.nextUrl.clone()
      dashboardUrl.pathname = '/dashboard'
      return NextResponse.redirect(dashboardUrl)
    }

    if (isPublicPage && pathname !== '/' && !pathname.startsWith('/auth')) {
      // Already logged in, don't show login/signup again
      const dashboardUrl = req.nextUrl.clone()
      dashboardUrl.pathname = '/dashboard'
      return NextResponse.redirect(dashboardUrl)
    }
  }

  return res
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
