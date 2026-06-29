'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import type { Profile } from '@/lib/types/database'

interface HeaderProps {
  title?: string
  showBack?: boolean
  backHref?: string
}

export function Header({ title, showBack, backHref }: HeaderProps) {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const supabase = createClient()

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        setProfile(data)
      }
    }
    loadProfile()
  }, [supabase])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-xl border-b border-white/5">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          {showBack ? (
            <button 
              onClick={() => backHref ? router.push(backHref) : router.back()}
              className="p-2 -ml-2 rounded-lg hover:bg-white/5 text-white/70 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          ) : (
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
          )}
          <div>
            <h1 className="text-sm font-bold text-white">{title || 'WMS สต็อก'}</h1>
            {profile && (
              <p className="text-xs text-white/50">
                {profile.full_name || 'ผู้ใช้'}
                <span className={`ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${
                  profile.role === 'owner'
                    ? 'bg-amber-500/20 text-amber-300'
                    : 'bg-indigo-500/20 text-indigo-300'
                }`}>
                  {profile.role === 'owner' ? 'Owner' : 'Staff'}
                </span>
              </p>
            )}
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="p-2 rounded-lg hover:bg-white/5 text-white/50 hover:text-white/70 transition-colors"
          title="ออกจากระบบ"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </div>
    </header>
  )
}
