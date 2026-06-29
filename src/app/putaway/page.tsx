import { getProducts, getLocations } from '@/actions/inbound'
import { Header } from '@/components/layout/Header'
import { PutawayScanner } from '@/components/putaway/PutawayScanner'
import { getRecentTransactions } from '@/actions/history'
import { RecentActions } from '@/components/history/RecentActions'

export default async function PutawayPage() {
  const products = await getProducts()
  const locations = await getLocations()
  
  const recentActions = await getRecentTransactions('MOVE', 5)

  return (
    <>
      <Header title="สินค้าเหลือส่งคืน (Putaway)" showBack backHref="/dashboard" />
      <div className="p-4 pb-32">
        <PutawayScanner products={products} locations={locations} />
        <RecentActions title="ประวัติการย้ายสินค้าล่าสุด" actions={recentActions} />
      </div>
    </>
  )
}
