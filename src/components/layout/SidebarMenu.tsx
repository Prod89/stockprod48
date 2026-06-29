'use client'

import { useState, useEffect, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils/cn'

export function SidebarMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const [role, setRole] = useState<'owner' | 'staff' | null>(null)
  const [userName, setUserName] = useState('')
  const pathname = usePathname()
  const router = useRouter()
  const sidebarRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    async function loadProfile() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data } = await supabase
            .from('profiles')
            .select('role, full_name')
            .eq('id', user.id)
            .single()
          if (data) {
            setRole(data.role)
            setUserName(data.full_name || 'ผู้ใช้')
          }
        }
      } catch (err) {
        console.error('Failed to load profile:', err)
      }
    }
    loadProfile()
  }, [supabase])

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // Close on route change
  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setIsOpen(false)
    router.push('/login')
    router.refresh()
  }

  const staffMenuItems = [
    {
      section: 'งานหน้าร้าน',
      items: [
        { href: '/dashboard', label: 'เมนูหลัก', icon: '🏠' },
        { href: '/inbound', label: 'รับเข้าสินค้า', icon: '📥', desc: 'สแกนบาร์โค้ดรับสินค้าเข้าคลัง' },
        { href: '/packing', label: 'จัดแพ็คออเดอร์', icon: '📦', desc: 'หยิบสินค้าตามออเดอร์ลูกค้า' },
        { href: '/stock-take', label: 'เช็คสต็อก', icon: '📋', desc: 'ตรวจนับสินค้าคงเหลือ' },
        { href: '/returns', label: 'คืนสินค้า', icon: '🔄', desc: 'รับสินค้าตีกลับเข้าคลัง' },
        { href: '/putaway', label: 'จัดเก็บเข้าชั้น', icon: '🗄️', desc: 'ย้ายสินค้าไปพิกัดจัดเก็บ' },
      ]
    }
  ]

  const ownerMenuItems = [
    {
      section: 'งานหน้าร้าน',
      items: [
        { href: '/dashboard', label: 'เมนูหลัก', icon: '🏠' },
        { href: '/inbound', label: 'รับเข้าสินค้า', icon: '📥', desc: 'สแกนบาร์โค้ดรับสินค้าเข้าคลัง' },
        { href: '/packing', label: 'จัดแพ็คออเดอร์', icon: '📦', desc: 'หยิบสินค้าตามออเดอร์ลูกค้า' },
        { href: '/stock-take', label: 'เช็คสต็อก', icon: '📋', desc: 'ตรวจนับสินค้าคงเหลือ' },
        { href: '/returns', label: 'คืนสินค้า', icon: '🔄', desc: 'รับสินค้าตีกลับเข้าคลัง' },
        { href: '/putaway', label: 'จัดเก็บเข้าชั้น', icon: '🗄️', desc: 'ย้ายสินค้าไปพิกัดจัดเก็บ' },
      ]
    },
    {
      section: 'หลังบ้านผู้บริหาร',
      items: [
        { href: '/owner/dashboard', label: 'แดชบอร์ดผู้บริหาร', icon: '📊', desc: 'ภาพรวมการเงิน สต็อก กำไร' },
        { href: '/orders', label: 'จัดการออเดอร์', icon: '🧾', desc: 'ดูรายการคำสั่งซื้อทั้งหมด' },
        { href: '/orders/create', label: 'สร้างออเดอร์', icon: '➕', desc: 'สร้างคำสั่งซื้อใหม่' },
      ]
    }
  ]

  const menuGroups = role === 'owner' ? ownerMenuItems : staffMenuItems

  return (
    <>
      {/* Hamburger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 -ml-2 rounded-xl hover:bg-white/10 active:bg-white/20 text-white/80 transition-all duration-150"
        aria-label="เปิดเมนู"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Overlay */}
      <div
        className={cn(
          'fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm transition-opacity duration-300',
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
      />

      {/* Sidebar Drawer */}
      <div
        ref={sidebarRef}
        className={cn(
          'fixed top-0 left-0 z-[101] h-full w-[280px] bg-slate-900 border-r border-white/10 shadow-2xl shadow-black/50 transition-transform duration-300 ease-out flex flex-col',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Header */}
        <div className="p-5 pb-4 border-b border-white/10 bg-gradient-to-br from-indigo-900/60 to-violet-900/60 flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 rounded-xl hover:bg-white/10 active:bg-white/20 text-white/60 transition-colors"
              aria-label="ปิดเมนู"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-white font-bold text-base">WMS สต็อก</p>
          <p className="text-white/50 text-xs mt-0.5">{userName}</p>
          <span className={cn(
            'inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold mt-1.5',
            role === 'owner' ? 'bg-amber-500/20 text-amber-300' : 'bg-indigo-500/20 text-indigo-300'
          )}>
            {role === 'owner' ? '👑 Owner' : '👤 Staff'}
          </span>
        </div>

        {/* Menu Items */}
        <div className="flex-1 overflow-y-auto py-3 px-3">
          {menuGroups.map((group) => (
            <div key={group.section} className="mb-4">
              <p className="text-[10px] text-white/30 font-bold uppercase tracking-wider px-3 mb-2">{group.section}</p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        'flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-150',
                        isActive
                          ? 'bg-indigo-500/15 text-white'
                          : 'text-white/60 hover:bg-white/5 hover:text-white active:bg-white/10'
                      )}
                    >
                      <span className="text-lg w-7 text-center flex-shrink-0">{item.icon}</span>
                      <div className="min-w-0">
                        <p className={cn('text-sm font-medium', isActive && 'text-indigo-300')}>{item.label}</p>
                        {item.desc && (
                          <p className="text-[10px] text-white/30 truncate">{item.desc}</p>
                        )}
                      </div>
                      {isActive && (
                        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-400 flex-shrink-0" />
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer: Logout */}
        <div className="p-3 border-t border-white/10 flex-shrink-0">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-3 rounded-xl text-red-400 hover:bg-red-500/10 active:bg-red-500/20 transition-all duration-150 w-full"
          >
            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="text-sm font-medium">ออกจากระบบ</span>
          </button>
        </div>
      </div>
    </>
  )
}
