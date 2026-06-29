import { getValuationSummary, getDeadStock, getAuditLogs, getLowStock, getAllProfiles, getSalesAnalytics, getCostSummary, getLotLocationStock, getTransactionSummary, getLotProfitability, getAgingAnalysis, getBaleHistory, getStockToCash, getInventoryByLocation, getActiveLocations } from '@/actions/owner'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { CsvImport } from '@/components/owner/CsvImport'
import { UserManagement } from '@/components/owner/UserManagement'
import { LotLocationViewer } from '@/components/owner/LotLocationViewer'
import { AgingDashboard } from '@/components/owner/AgingDashboard'
import { BaleCostManager } from '@/components/owner/BaleCostManager'
import { InventoryLocationManager } from '@/components/owner/InventoryLocationManager'
import { format } from 'date-fns'

export async function OwnerDashboard() {
  const valuation = await getValuationSummary()
  const deadStock = await getDeadStock()
  const lowStock = await getLowStock()
  const auditLogs = await getAuditLogs(10)
  const profiles = await getAllProfiles()
  const sales = await getSalesAnalytics()
  const costSummary = await getCostSummary()
  const lotLocationStock = await getLotLocationStock()
  const transactionSummary = await getTransactionSummary()
  const lotProfitability = await getLotProfitability()
  const agingData = await getAgingAnalysis()
  const baleHistory = await getBaleHistory()
  const stockToCash = await getStockToCash()
  const inventoryByLocation = await getInventoryByLocation()
  const activeLocations = await getActiveLocations()

  const totalValue = valuation.reduce((sum: number, item: any) => sum + Number(item.total_value), 0)
  const availableValue = valuation.filter((v: any) => v.status === 'AVAILABLE').reduce((sum: number, item: any) => sum + Number(item.total_value), 0)
  const inBaleValue = valuation.filter((v: any) => v.status === 'IN-BALE').reduce((sum: number, item: any) => sum + Number(item.total_value), 0)
  const totalDeadValue = deadStock.reduce((sum: number, item: any) => sum + Number(item.stranded_value), 0)

  return (
    <div className="p-4 pb-32 space-y-6">
      
      {/* Quick Access (Compact) */}
      <div className="grid grid-cols-5 gap-2 mb-6">
        <Link href="/inbound" className="bg-slate-800 border border-indigo-500/30 p-2 rounded-xl flex flex-col items-center justify-center gap-1 hover:bg-slate-700 transition-colors">
          <span className="text-xl">📥</span>
          <span className="text-[10px] font-medium text-white">รับเข้า</span>
        </Link>
        <Link href="/packing" className="bg-slate-800 border border-violet-500/30 p-2 rounded-xl flex flex-col items-center justify-center gap-1 hover:bg-slate-700 transition-colors">
          <span className="text-xl">📦</span>
          <span className="text-[10px] font-medium text-white">จัดแพ็ค</span>
        </Link>
        <Link href="/returns" className="bg-slate-800 border border-rose-500/30 p-2 rounded-xl flex flex-col items-center justify-center gap-1 hover:bg-slate-700 transition-colors">
          <span className="text-xl">🔄</span>
          <span className="text-[10px] font-medium text-white">คืนของ</span>
        </Link>
        <Link href="/stock-take" className="bg-slate-800 border border-amber-500/30 p-2 rounded-xl flex flex-col items-center justify-center gap-1 hover:bg-slate-700 transition-colors">
          <span className="text-xl">📋</span>
          <span className="text-[10px] font-medium text-white">เช็คสต็อก</span>
        </Link>
        <Link href="/owner/inventory" className="bg-slate-800 border border-emerald-500/30 p-2 rounded-xl flex flex-col items-center justify-center gap-1 hover:bg-slate-700 transition-colors">
          <span className="text-xl">🔍</span>
          <span className="text-[10px] font-medium text-white text-center leading-tight">คลังสินค้า<br/>เชิงลึก</span>
        </Link>
      </div>

      {/* Total Assets Summary */}
        <div className="bg-gradient-to-br from-indigo-900 to-violet-900 p-6 rounded-3xl border border-indigo-500/30 shadow-2xl">
          <h2 className="text-indigo-200 text-sm font-medium mb-1">มูลค่าสินทรัพย์รวม (Stock Value)</h2>
          <p className="text-4xl font-bold text-white mb-6">฿{totalValue.toLocaleString()}</p>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-white/5 rounded-xl p-3 border border-emerald-500/30">
              <p className="text-xs text-emerald-400 mb-1">พร้อมขาย (AVAILABLE)</p>
              <p className="text-lg font-bold text-white">฿{availableValue.toLocaleString()}</p>
            </div>
            <div className="bg-white/5 rounded-xl p-3 border border-amber-500/30">
              <p className="text-xs text-amber-400 mb-1">ทุนจมกระสอบ (IN-BALE)</p>
              <p className="text-lg font-bold text-white">฿{inBaleValue.toLocaleString()}</p>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-xs text-indigo-300 font-medium">แยกตามเกรดและล็อต</p>
            {valuation.map((v: any, index: number) => (
              <div key={index} className="flex justify-between items-center text-sm border-t border-white/10 pt-2">
                <span className="text-indigo-100 flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${v.grade === 'Premium' ? 'bg-amber-400' : 'bg-slate-400'}`}></div>
                  เกรด {v.grade} ({v.status})
                </span>
                <span className="font-medium text-white">฿{Number(v.total_value).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Low Stock Alert */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <svg className={`w-5 h-5 ${lowStock.some((item: any) => item.available_qty <= 2) ? 'text-red-500' : 'text-amber-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h3 className="text-lg font-bold text-white">สินค้าใกล้หมด (Low Stock &lt; 5)</h3>
          </div>
          
          <Card padding="md" className={lowStock.some((item: any) => item.available_qty <= 2) ? 'border-red-500/20 bg-red-500/5' : 'border-amber-500/20 bg-amber-500/5'}>
            <div className="space-y-3">
              {lowStock.map((item: any) => {
                const isCritical = item.available_qty <= 2
                return (
                  <div key={item.product_id} className={`flex justify-between items-center border-t ${isCritical ? 'border-red-500/10' : 'border-amber-500/10'} pt-3 first:border-0 first:pt-0`}>
                    <div>
                      <p className="text-white text-sm">{item.name}</p>
                      <p className="text-xs text-slate-400 font-mono">{item.sku}</p>
                    </div>
                    <div className="text-right">
                      <p className={`${isCritical ? 'text-red-400' : 'text-amber-400'} font-bold`}>{item.available_qty} ชิ้น</p>
                    </div>
                  </div>
                )
              })}
              {lowStock.length === 0 && (
                <p className="text-slate-400 text-sm text-center py-4">ไม่มีสินค้าคงเหลือน้อย</p>
              )}
            </div>
          </Card>
        </div>

        {/* Sales Analytics Summary */}
        <div className="space-y-3">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            สรุปยอดขายและการตลาด (Sales Analytics)
          </h3>
          <Card padding="md" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-900/50 p-4 rounded-xl border border-indigo-500/20">
                <p className="text-xs text-indigo-300 mb-1">ยอดขายวันนี้ (Daily)</p>
                <p className="text-xl font-bold text-white">฿{sales.dailySales.toLocaleString()}</p>
              </div>
              <div className="bg-slate-900/50 p-4 rounded-xl border border-indigo-500/20">
                <p className="text-xs text-indigo-300 mb-1">ยอดขายเดือนนี้ (Monthly)</p>
                <p className="text-xl font-bold text-white">฿{sales.monthlySales.toLocaleString()}</p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs text-slate-400 font-medium">Top 10 สินค้าขายดีที่สุด (ชิ้น)</p>
              <div className="space-y-2">
                {sales.top10.map((item: any, idx: number) => (
                  <div key={item.sku} className="flex justify-between items-center text-sm border-t border-white/5 pt-2 first:border-0 first:pt-0 font-sans">
                    <span className="text-slate-300 flex items-center gap-2 font-mono text-xs">
                      <span className="text-indigo-400 font-bold w-4">{idx + 1}.</span>
                      {item.sku}
                    </span>
                    <span className="text-white font-medium text-xs truncate max-w-[120px]">{item.name}</span>
                    <span className="text-indigo-300 font-bold text-xs">{item.qty} ชิ้น</span>
                  </div>
                ))}
                {sales.top10.length === 0 && (
                  <p className="text-slate-500 text-xs text-center py-2">ยังไม่มียอดขายที่ส่งมอบเรียบร้อย</p>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Lot Location Stock & Cost Analysis */}
        <LotLocationViewer 
          lotLocationStock={lotLocationStock}
          costSummary={costSummary}
          transactionSummary={transactionSummary}
        />

        {/* Unified Location & Status Tracking */}
        <InventoryLocationManager 
          inventory={inventoryByLocation}
          locations={activeLocations}
        />

        {/* Aging + Profitability + Stock-to-Cash */}
        <AgingDashboard 
          agingData={agingData}
          lotProfitability={lotProfitability}
          stockToCash={stockToCash}
        />

        {/* Bale Cost Log */}
        <BaleCostManager baleHistory={baleHistory} />

        {/* Dead Stock Alert */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h3 className="text-lg font-bold text-white">แจ้งเตือนเงินจม (ZONE-RETURN)</h3>
          </div>
          
          <Card padding="md" className="border-red-500/20 bg-red-500/5">
            <p className="text-sm text-red-400 mb-4">ยอดเงินจมในโซนคืนของ: <strong>฿{totalDeadValue.toLocaleString()}</strong></p>
            <div className="space-y-3">
              {deadStock.map((item: any) => (
                <div key={item.product_id} className="flex justify-between items-center border-t border-red-500/10 pt-3 first:border-0 first:pt-0">
                  <div>
                    <p className="text-white text-sm">{item.name}</p>
                    <p className="text-xs text-slate-400">{item.sku}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-red-400 font-bold">{item.stranded_qty} ชิ้น</p>
                    <p className="text-xs text-slate-400">฿{Number(item.stranded_value).toLocaleString()}</p>
                  </div>
                </div>
              ))}
              {deadStock.length === 0 && (
                <p className="text-slate-400 text-sm text-center py-4">ไม่มีสินค้าตกค้างใน ZONE-RETURN</p>
              )}
            </div>
          </Card>
        </div>

        {/* User Management */}
        <div className="space-y-3">
          <UserManagement initialProfiles={profiles} />
        </div>

        {/* CSV Import */}
        <div className="space-y-3">
          <CsvImport />
        </div>

        {/* Audit Logs */}
        <div className="space-y-3">
          <h3 className="text-lg font-bold text-white">ประวัติการทำงาน (Audit Logs)</h3>
          <Card padding="md" className="space-y-4">
            {auditLogs.map((log: any) => (
              <div key={log.id} className="flex flex-col gap-1 border-l-2 border-indigo-500 pl-3">
                <div className="flex justify-between items-start">
                  <p className="text-sm text-white font-medium">{log.profiles?.full_name || 'System'}</p>
                  <span className="text-[10px] text-slate-500">{format(new Date(log.created_at), 'dd/MM/yyyy HH:mm')}</span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant={log.action_type === 'INSERT' ? 'success' : log.action_type === 'DELETE' ? 'error' : 'warning'}>
                    {log.action_type}
                  </Badge>
                  <span className="text-xs text-slate-400">ตาราง {log.table_name}</span>
                  {log.sku && (
                    <span className="text-xs text-indigo-300 font-mono font-bold">SKU: {log.sku}</span>
                  )}
                </div>
                {log.before_qty !== undefined && log.before_qty !== null && log.after_qty !== undefined && log.after_qty !== null && (
                  <p className="text-xs text-slate-400">
                    ความเคลื่อนไหว: <strong className="text-slate-300">{log.before_qty}</strong> → <strong className="text-white">{log.after_qty}</strong> 
                    {log.reason_code && <span className="ml-1.5 text-slate-500">({log.reason_code})</span>}
                  </p>
                )}
                {log.device_info && (
                  <p className="text-[10px] text-slate-500 mt-0.5 font-mono">📱 {log.device_info}</p>
                )}
              </div>
            ))}
          </Card>
        </div>

      </div>
  )
}

