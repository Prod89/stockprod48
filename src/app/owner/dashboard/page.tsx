import { getValuationSummary, getDeadStock, getAuditLogs, getLowStock, getAllProfiles } from '@/actions/owner'
import { Header } from '@/components/layout/Header'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { CsvImport } from '@/components/owner/CsvImport'
import { UserManagement } from '@/components/owner/UserManagement'
import { format } from 'date-fns'

export default async function OwnerDashboardPage() {
  const valuation = await getValuationSummary()
  const deadStock = await getDeadStock()
  const lowStock = await getLowStock()
  const auditLogs = await getAuditLogs(10)
  const profiles = await getAllProfiles()

  const totalValue = valuation.reduce((sum: number, item: any) => sum + Number(item.total_value), 0)
  const availableValue = valuation.filter((v: any) => v.status === 'AVAILABLE').reduce((sum: number, item: any) => sum + Number(item.total_value), 0)
  const inBaleValue = valuation.filter((v: any) => v.status === 'IN-BALE').reduce((sum: number, item: any) => sum + Number(item.total_value), 0)
  const totalDeadValue = deadStock.reduce((sum: number, item: any) => sum + Number(item.stranded_value), 0)

  return (
    <>
      <Header title="Executive Dashboard" showBack backHref="/dashboard" />
      <div className="p-4 pb-24 space-y-6">
        
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
            <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h3 className="text-lg font-bold text-white">สินค้าใกล้หมด (Low Stock &lt; 5)</h3>
          </div>
          
          <Card padding="md" className="border-amber-500/20 bg-amber-500/5">
            <div className="space-y-3">
              {lowStock.map((item: any) => (
                <div key={item.product_id} className="flex justify-between items-center border-t border-amber-500/10 pt-3 first:border-0 first:pt-0">
                  <div>
                    <p className="text-white text-sm">{item.name}</p>
                    <p className="text-xs text-slate-400 font-mono">{item.sku}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-amber-400 font-bold">{item.available_qty} ชิ้น</p>
                  </div>
                </div>
              ))}
              {lowStock.length === 0 && (
                <p className="text-slate-400 text-sm text-center py-4">ไม่มีสินค้าคงเหลือน้อย</p>
              )}
            </div>
          </Card>
        </div>

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

        {/* User Management & Security Lockdown */}
        <div className="space-y-3">
          <UserManagement initialProfiles={profiles} />
        </div>

        {/* Offline Recovery / CSV Import */}
        <div className="space-y-3">
          <CsvImport />
        </div>

        {/* Audit Logs Preview */}
        <div className="space-y-3">
          <h3 className="text-lg font-bold text-white">ประวัติการทำงาน (Audit Logs)</h3>
          <Card padding="md" className="space-y-4">
            {auditLogs.map((log: any) => (
              <div key={log.id} className="flex flex-col gap-1 border-l-2 border-indigo-500 pl-3">
                <div className="flex justify-between items-start">
                  <p className="text-sm text-white font-medium">{log.profiles?.full_name || 'System'}</p>
                  <span className="text-[10px] text-slate-500">{format(new Date(log.created_at), 'dd/MM HH:mm')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={log.action_type === 'INSERT' ? 'success' : log.action_type === 'DELETE' ? 'error' : 'warning'}>
                    {log.action_type}
                  </Badge>
                  <span className="text-xs text-slate-400">ตาราง {log.table_name}</span>
                </div>
                {log.device_info && (
                  <p className="text-[10px] text-slate-500 mt-1 font-mono">📱 {log.device_info}</p>
                )}
              </div>
            ))}
          </Card>
        </div>

      </div>
    </>
  )
}
