import { Header } from '@/components/layout/Header'
import { StaffDashboard } from '@/components/dashboard/StaffDashboard'
import { OwnerDashboard } from '@/components/dashboard/OwnerDashboard'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  
  return (
    <>
      <Header title={profile?.role === 'owner' ? "Executive Dashboard" : "WMS Dashboard"} />
      {profile?.role === 'owner' ? <OwnerDashboard /> : <StaffDashboard />}
    </>
  )
}

