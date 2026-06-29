import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session if expired - required for Server Components
  const { data: { user } } = await supabase.auth.getUser()

  // Redirect unauthenticated users to login (except for login page and public assets)
  const isLoginPage = request.nextUrl.pathname === '/login'
  const isPublicAsset = request.nextUrl.pathname.startsWith('/_next') ||
    request.nextUrl.pathname.startsWith('/icons') ||
    request.nextUrl.pathname === '/sw.js' ||
    request.nextUrl.pathname === '/favicon.ico' ||
    request.nextUrl.pathname === '/manifest.webmanifest'

  if (!user && !isLoginPage && !isPublicAsset) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Redirect authenticated users away from login page
  if (user && isLoginPage) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // Owner Route Guard
  if (user && request.nextUrl.pathname.startsWith('/owner')) {
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'owner') {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
