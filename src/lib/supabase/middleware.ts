import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Supabase environment variables are missing!')
    return supabaseResponse
  }

  try {
    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
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

    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, is_active')
        .eq('id', user.id)
        .single()
      
      if (profile && profile.is_active === false) {
        // Force sign out and redirect
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        url.searchParams.set('error', 'revoked')
        
        // Return redirect response and clear cookies (will trigger signout on browser)
        const response = NextResponse.redirect(url)
        response.cookies.delete('sb-access-token')
        response.cookies.delete('sb-refresh-token')
        return response
      }
    }

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
  } catch (err) {
    console.error('Middleware session update failed:', err)
  }

  return supabaseResponse
}
