import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export default async function proxy(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - sw.js, workbox-*.js (service worker files)
     * - icons/ (PWA icons)
     */
    '/((?!_next/static|_next/image|favicon\\.ico|sw\\.js|workbox-.*\\.js|icons/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'
  ],
}
