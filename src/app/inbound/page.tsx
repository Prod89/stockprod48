import { InboundForm } from '@/components/inbound/InboundForm'
import { getProducts, getLocations } from '@/actions/inbound'
import { Header } from '@/components/layout/Header'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'รับเข้าสินค้า — WMS สต็อก',
}

export default async function InboundPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  let role = 'staff'
  if (user) {
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile) role = profile.role
  }

  const [products, locations] = await Promise.all([
    getProducts(),
    getLocations(),
  ])

  return (
    <>
      <Header title="รับเข้าสินค้า" showBack backHref="/dashboard" />
      <div className="p-4">
        <InboundForm products={products} locations={locations} userRole={role} />
      </div>
    </>
  )
}

