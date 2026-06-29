import { InboundForm } from '@/components/inbound/InboundForm'
import { getProducts, getLocations } from '@/actions/inbound'
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
    <div className="px-4 py-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <svg className="w-6 h-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          รับเข้าสินค้า
        </h2>
        <p className="text-sm text-white/50 mt-1">สแกนบาร์โค้ด แยกเกรด และบันทึกรูปสินค้า</p>
      </div>
      
      <InboundForm products={products} locations={locations} />
    </div>
  )
}
