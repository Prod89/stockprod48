'use client'

import { useState } from 'react'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { toggleUserActive } from '@/actions/owner'

interface UserManagementProps {
  initialProfiles: any[]
}

export function UserManagement({ initialProfiles }: UserManagementProps) {
  const [profiles, setProfiles] = useState(initialProfiles)
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const handleToggleActive = async (userId: string, currentStatus: boolean) => {
    setLoadingId(userId)
    const result = await toggleUserActive(userId, !currentStatus)
    setLoadingId(null)
    
    if (result.success) {
      setProfiles(prev => prev.map(p => p.id === userId ? { ...p, is_active: !currentStatus } : p))
    }
  }

  return (
    <Card padding="md" className="space-y-4">
      <h3 className="text-lg font-bold text-white flex items-center gap-2">
        <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
        จัดการพนักงาน (User & Security Lockdown)
      </h3>
      
      <div className="space-y-3">
        {profiles.map((p) => (
          <div key={p.id} className="flex justify-between items-center border-t border-white/5 pt-3 first:border-0 first:pt-0">
            <div>
              <p className="text-white font-medium text-sm flex items-center gap-2">
                {p.full_name || 'ไม่มีชื่อ'}
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${p.role === 'owner' ? 'bg-amber-500/20 text-amber-300' : 'bg-indigo-500/20 text-indigo-300'}`}>
                  {p.role === 'owner' ? 'Owner' : 'Staff'}
                </span>
              </p>
              <p className="text-xs text-slate-400 font-mono mt-0.5">{p.id}</p>
            </div>
            
            <div className="flex items-center gap-2">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.is_active !== false ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                {p.is_active !== false ? 'ปกติ' : 'บล็อกแล้ว'}
              </span>
              
              {p.role !== 'owner' && (
                <Button 
                  onClick={() => handleToggleActive(p.id, p.is_active !== false)}
                  isLoading={loadingId === p.id}
                  variant={p.is_active !== false ? 'danger' : 'secondary'}
                  size="sm"
                  className="min-h-[36px] text-xs font-semibold px-3"
                >
                  {p.is_active !== false ? 'บล็อกสิทธิ์' : 'ปลดบล็อก'}
                </Button>
              )}
            </div>
          </div>
        ))}
        {profiles.length === 0 && (
          <p className="text-slate-400 text-sm text-center py-4">ไม่พบรายชื่อพนักงาน</p>
        )}
      </div>
    </Card>
  )
}
