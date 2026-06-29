'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import type { Profile } from '@/lib/types/database'
import { SidebarMenu } from './SidebarMenu'

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

  return (
    <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-xl border-b border-white/5">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
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
            <SidebarMenu />
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
        <div className="w-8" /> {/* Spacer for visual balance */}
      </div>
    </header>
  )
}
