'use client'

import { useState } from 'react'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'

interface AgingDashboardProps {
  agingData: any[]
  lotProfitability: any[]
  stockToCash: any
}

export function AgingDashboard({ agingData, lotProfitability, stockToCash }: AgingDashboardProps) {
  const [profitSearch, setProfitSearch] = useState('')

  const exportToCsv = (data: any[], filename: string) => {
    if (data.length === 0) return
    const headers = Object.keys(data[0]).join(',')
    const rows = data.map(row => Object.values(row).map(val => `"${String(val ?? '').replace(/"/g, '""')}"`).join(','))
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers, ...rows].join('\n')
    const link = document.createElement('a')
    link.setAttribute('href', encodeURI(csvContent))
    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Aggregate aging by bucket
  const buckets = { '0-30 วัน': { qty: 0, value: 0 }, '31-60 วัน': { qty: 0, value: 0 }, '60+ วัน': { qty: 0, value: 0 } }
  agingData.forEach((item: any) => {
    const key = item.aging_bucket as keyof typeof buckets
    if (buckets[key]) {
      buckets[key].qty += Number(item.on_hand_qty)
      buckets[key].value += Number(item.on_hand_value || 0)
    }
  })
  const totalAgingValue = Object.values(buckets).reduce((s, b) => s + b.value, 0)

  // Filter lot profitability
  const filteredLots = lotProfitability.filter((item: any) =>
    !profitSearch || item.lot_date?.toLowerCase().includes(profitSearch.toLowerCase())
  )

  return (
    <div className="space-y-6">

      {/* Stock-to-Cash Summary */}
      <Card padding="md" className="space-y-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          สรุปสต็อกประจำเดือน (Stock-to-Cash)
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-900/80 p-3 rounded-xl border border-white/10 text-center">
            <p className="text-[10px] text-slate-500 mb-0.5">ยอดต้นงวด</p>
            <p className="text-xl font-bold text-white font-mono">{stockToCash.openingStock.toLocaleString()}</p>
          </div>
          <div className="bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20 text-center">
            <p className="text-[10px] text-emerald-400 mb-0.5">+ รับเข้า</p>
            <p className="text-xl font-bold text-emerald-300 font-mono">+{stockToCash.periodIn.toLocaleString()}</p>
          </div>
          <div className="bg-rose-500/10 p-3 rounded-xl border border-rose-500/20 text-center">
            <p className="text-[10px] text-rose-400 mb-0.5">- ขายออก</p>
            <p className="text-xl font-bold text-rose-300 font-mono">-{stockToCash.periodOut.toLocaleString()}</p>
          </div>
          <div className="bg-amber-500/10 p-3 rounded-xl border border-amber-500/20 text-center">
            <p className="text-[10px] text-amber-400 mb-0.5">± ปรับสต็อก</p>
            <p className="text-xl font-bold text-amber-300 font-mono">{stockToCash.periodAdjust >= 0 ? '+' : ''}{stockToCash.periodAdjust.toLocaleString()}</p>
          </div>
        </div>
        <div className="bg-gradient-to-r from-indigo-900/80 to-violet-900/80 p-4 rounded-xl border border-indigo-500/30">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-indigo-200">= ยอดปิดงวด (Closing Stock)</span>
            <span className="text-2xl font-bold text-white font-mono">{stockToCash.closingStock.toLocaleString()} <span className="text-sm font-normal">ชิ้น</span></span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-white/10">
            <span className="text-xs text-slate-400">Variance (ผลต่างจากการปรับ)</span>
            <span className={`text-sm font-bold font-mono ${stockToCash.variance === 0 ? 'text-emerald-400' : stockToCash.variance > 0 ? 'text-amber-400' : 'text-red-400'}`}>
              {stockToCash.variance === 0 ? '✓ ตรงเป๊ะ' : `${stockToCash.variance > 0 ? '+' : ''}${stockToCash.variance.toLocaleString()} ชิ้น`}
            </span>
          </div>
        </div>
      </Card>

      {/* Aging Dashboard */}
      <Card padding="md" className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            อายุสินค้าค้างในโกดัง (Aging Analysis)
          </h3>
          <Button onClick={() => exportToCsv(agingData, 'aging-analysis.csv')} size="sm" variant="secondary" className="text-xs min-h-[32px]">Export</Button>
        </div>

        {/* Aging Buckets */}
        <div className="grid grid-cols-3 gap-3">
          {Object.entries(buckets).map(([bucket, data]) => {
            const pct = totalAgingValue > 0 ? (data.value / totalAgingValue * 100) : 0
            const color = bucket === '0-30 วัน' ? 'emerald' : bucket === '31-60 วัน' ? 'amber' : 'red'
            return (
              <div key={bucket} className={`bg-${color}-500/10 p-3 rounded-xl border border-${color}-500/20 text-center`}
                style={{ backgroundColor: color === 'emerald' ? 'rgba(16,185,129,0.1)' : color === 'amber' ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)', borderColor: color === 'emerald' ? 'rgba(16,185,129,0.2)' : color === 'amber' ? 'rgba(245,158,11,0.2)' : 'rgba(239,68,68,0.2)' }}>
                <p className="text-[10px] mb-1" style={{ color: color === 'emerald' ? '#6ee7b7' : color === 'amber' ? '#fcd34d' : '#fca5a5' }}>{bucket}</p>
                <p className="text-lg font-bold text-white font-mono">{data.qty.toLocaleString()}</p>
                <p className="text-[10px] text-slate-400">฿{data.value.toLocaleString()}</p>
                <div className="mt-1.5 h-1 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: color === 'emerald' ? '#10b981' : color === 'amber' ? '#f59e0b' : '#ef4444' }} />
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      {/* Lot Profitability Table */}
      <Card padding="md" className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            กำไร-ขาดทุน รายล็อต (Lot Profitability)
          </h3>
          <Button onClick={() => exportToCsv(filteredLots, 'lot-profitability.csv')} size="sm" variant="secondary" className="text-xs min-h-[32px]">Export CSV</Button>
        </div>

        <input
          type="text"
          placeholder="🔍 ค้นหาเลขล็อต..."
          value={profitSearch}
          onChange={e => setProfitSearch(e.target.value)}
          className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-slate-300">
            <thead className="text-[10px] text-indigo-300 uppercase bg-white/5 sticky top-0">
              <tr>
                <th className="px-3 py-2.5">ล็อต</th>
                <th className="px-3 py-2.5 text-right">SKUs</th>
                <th className="px-3 py-2.5 text-right">เข้า</th>
                <th className="px-3 py-2.5 text-right">ขาย</th>
                <th className="px-3 py-2.5 text-right">เหลือ</th>
                <th className="px-3 py-2.5 text-right">ต้นทุนขาย</th>
                <th className="px-3 py-2.5 text-right">รายรับ</th>
                <th className="px-3 py-2.5 text-right">กำไร/ขาดทุน</th>
              </tr>
            </thead>
            <tbody>
              {filteredLots.map((row: any) => {
                const revenue = Number(row.total_revenue || 0)
                const costOfSold = Number(row.total_cost_of_sold || 0)
                const profit = revenue - costOfSold
                return (
                  <tr key={row.lot_date} className="border-b border-white/5 hover:bg-white/5">
                    <td className="px-3 py-2.5 text-indigo-300 font-mono font-bold">{row.lot_date}</td>
                    <td className="px-3 py-2.5 text-right font-mono">{row.sku_count}</td>
                    <td className="px-3 py-2.5 text-right font-mono text-emerald-400">{Number(row.total_inbound).toLocaleString()}</td>
                    <td className="px-3 py-2.5 text-right font-mono text-rose-400">{Number(row.total_sold).toLocaleString()}</td>
                    <td className="px-3 py-2.5 text-right font-mono text-white">{Number(row.remaining_qty || 0).toLocaleString()}</td>
                    <td className="px-3 py-2.5 text-right font-mono text-slate-400">฿{costOfSold.toLocaleString()}</td>
                    <td className="px-3 py-2.5 text-right font-mono text-emerald-400">฿{revenue.toLocaleString()}</td>
                    <td className={`px-3 py-2.5 text-right font-mono font-bold ${profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {profit >= 0 ? '+' : ''}฿{profit.toLocaleString()}
                    </td>
                  </tr>
                )
              })}
              {filteredLots.length === 0 && (
                <tr><td colSpan={8} className="text-center py-4 text-slate-500">ไม่พบข้อมูลล็อต</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
