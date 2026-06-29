import { Header } from '@/components/layout/Header'
import { LivePackingScanner } from '@/components/packing/LivePackingScanner'
import { getRecentTransactions } from '@/actions/history'
import { RecentActions } from '@/components/history/RecentActions'

export default async function PackingPage() {
  const recentActions = await getRecentTransactions('OUT', 5)

  return (
    <>
      <Header title="เบิกรอขาย (Packing)" showBack backHref="/dashboard" />
      <div className="p-4 pb-32">
        <LivePackingScanner />
        <RecentActions title="ประวัติการเบิกสินค้าล่าสุด" actions={recentActions} />
      </div>
    </>
  )
}
