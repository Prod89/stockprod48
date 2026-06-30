import { Header } from '@/components/layout/Header'
import { StaffManual } from '@/components/manual/StaffManual'
import { OwnerManual } from '@/components/manual/OwnerManual'
import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/Card'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'คู่มือการใช้งาน — WMS สต็อก',
}

export default async function ManualPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  let role = 'staff'
  let userName = ''
  
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, full_name')
      .eq('id', user.id)
      .single()
      
    if (profile) {
      role = profile.role
      userName = profile.full_name || 'ผู้ใช้'
    }
  }

  const isOwner = role === 'owner'

  return (
    <>
      <Header title="คู่มือการใช้งาน (Manual)" showBack backHref="/dashboard" />
      <div className="p-4 pb-32 space-y-6 max-w-2xl mx-auto">
        <div className="text-center mb-6 mt-4">
          <h1 className="text-2xl font-bold text-white mb-2">สวัสดีคุณ {userName}</h1>
          <p className="text-slate-400 text-sm">
            ยินดีต้อนรับสู่คู่มือการใช้งานระบบจัดการคลังสินค้า WMS
          </p>
        </div>

        {/* Staff Manual (Visible to both Staff and Owner) */}
        <StaffManual />

        {/* Owner Manual (Visible ONLY to Owner) */}
        {isOwner && (
          <div className="pt-8 border-t border-white/10 mt-8">
            <OwnerManual />
          </div>
        )}
        
        {!isOwner && (
          <Card padding="md" className="bg-slate-900/50 text-center py-8">
            <p className="text-slate-500 text-sm">
              หากพบปัญหาการใช้งาน กรุณาติดต่อผู้ดูแลระบบ (Owner)
            </p>
          </Card>
        )}
      </div>
    </>
  )
}
