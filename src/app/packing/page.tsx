import { getRecentOrders } from '@/actions/orders'
import { Header } from '@/components/layout/Header'
import { PackingScanner } from '@/components/packing/PackingScanner'

export default async function PackingPage() {
  const pendingOrders = await getRecentOrders('PENDING')

  return (
    <>
      <Header title="แพ็คของ (Packing)" />
      <div className="p-4 pb-32">
        <PackingScanner orders={pendingOrders} />
      </div>
    </>
  )
}
