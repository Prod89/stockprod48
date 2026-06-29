'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils/cn'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

export function MobileNav() {
  const pathname = usePathname()
  const [role, setRole] = useState<'owner' | 'staff' | null>(null)
  const supabase = createClient()

  useEffect(() => {
    // Check if on login page, skip role fetching if so
    if (pathname === '/login') return;
    async function loadRole() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()
          if (data) {
            setRole(data.role)
          }
        }
      } catch (err) {
        console.error('Failed to load role in navbar:', err)
      }
    }
    loadRole()
  }, [supabase])

  const navItems = [
    {
      href: '/dashboard',
      label: 'แดชบอร์ด',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      ),
    },
    ...(role === 'owner' ? [
      {
        href: '/owner/inventory',
        label: 'คลัง',
        icon: (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        ),
      }
    ] : [
      {
        href: '/stock-take',
        label: 'เช็คสต็อก',
        icon: (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
        ),
      }
    ]),
    {
      href: '/inbound',
      label: 'รับเข้า',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
        </svg>
      ),
      isPrimary: true,
    },
    {
      href: '/packing',
      label: 'จัดแพ็ค',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
    },
    {
      href: '/returns',
      label: 'คืนของ',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
        </svg>
      ),
    },
  ]

  if (pathname === '/login') return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-xl border-t border-white/5 pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-between px-4 py-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-0.5 py-2 px-3 rounded-xl transition-all duration-200 min-w-[64px]',
                item.isPrimary
                  ? 'relative -mt-5'
                  : isActive
                    ? 'text-indigo-400'
                    : 'text-white/40 hover:text-white/60'
              )}
            >
              {item.isPrimary ? (
                <div className={cn(
                  'w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-200',
                  isActive
                    ? 'bg-gradient-to-r from-indigo-500 to-violet-500 shadow-indigo-500/30 scale-110'
                    : 'bg-gradient-to-r from-indigo-600 to-violet-600 shadow-indigo-500/20 hover:scale-105'
                )}>
                  <span className="text-white">{item.icon}</span>
                </div>
              ) : (
                item.icon
              )}
              <span className={cn(
                'text-[10px] font-medium',
                item.isPrimary && (isActive ? 'text-indigo-400' : 'text-white/60')
              )}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
