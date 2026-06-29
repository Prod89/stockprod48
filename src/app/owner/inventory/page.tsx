import { getDetailedInventory } from '@/actions/inventory'
import { getActiveLocations } from '@/actions/owner'
import { Header } from '@/components/layout/Header'
import { InventoryTable } from '@/components/inventory/InventoryTable'

export const dynamic = 'force-dynamic'

export default async function OwnerInventoryPage() {
  const [inventoryData, locations] = await Promise.all([
    getDetailedInventory(),
    getActiveLocations()
  ])

  // Calculate summary stats
  const totalItems = inventoryData.reduce((sum, item) => sum + item.quantity, 0)
  const totalValue = inventoryData.reduce((sum, item) => sum + item.total_value, 0)

  return (
    <>
      <Header title="คลังสินค้าเชิงลึก (Inventory Audit)" showBack backHref="/dashboard" />
      
      <div className="p-4 pb-32 space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
            <p className="text-sm text-slate-400">จำนวนสินค้าทั้งหมด</p>
            <p className="text-2xl font-bold text-emerald-400 font-mono mt-1">
              {totalItems.toLocaleString()} <span className="text-sm text-slate-500 font-sans">ชิ้น</span>
            </p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
            <p className="text-sm text-slate-400">มูลค่ารวม (Total Value)</p>
            <p className="text-2xl font-bold text-indigo-400 font-mono mt-1">
              ฿{totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        <InventoryTable initialData={inventoryData} locations={locations} />
      </div>
    </>
  )
}
