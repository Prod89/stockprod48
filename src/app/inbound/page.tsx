import { InboundForm } from '@/components/inbound/InboundForm'
import { getProducts, getLocations } from '@/actions/inbound'
import { Header } from '@/components/layout/Header'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'รับเข้าสินค้า — WMS สต็อก',
}

export default async function InboundPage() {
  const [products, locations] = await Promise.all([
    getProducts(),
    getLocations(),
  ])

  return (
    <>
      <Header title="รับเข้าสินค้า" showBack backHref="/dashboard" />
      <div className="p-4">
        <InboundForm products={products} locations={locations} />
      </div>
    </>
  )
}
