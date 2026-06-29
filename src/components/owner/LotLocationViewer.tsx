'use client'

import { useState } from 'react'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'

interface LotLocationViewerProps {
  lotLocationStock: any[]
  costSummary: any[]
  transactionSummary: any
}

export function LotLocationViewer({ lotLocationStock, costSummary, transactionSummary }: LotLocationViewerProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [timeframe, setTimeframe] = useState<'daily' | 'weekly' | 'monthly'>('monthly')

  const exportToCsv = (data: any[], filename: string) => {
    if (data.length === 0) return
    const headers = Object.keys(data[0]).join(',')
    const rows = data.map(row => 
      Object.values(row)
        .map(val => `"${String(val).replace(/"/g, '""')}"`)
        .join(',')
    )
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers, ...rows].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Filter stock tracking data
  const filteredStock = lotLocationStock.filter((item: any) => 
    item.lot_date?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const activeStats = transactionSummary[timeframe]

  return (
    <div className="space-y-6">
      
      {/* 1. Inbound vs Outbound Summary Card */}
      <Card padding="md" className="space-y-4">
        <div className="flex justify-between items-center flex-wrap gap-2">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            สรุปการเคลื่อนไหวสต็อก (Inbound vs Outbound)
          </h3>
          <div className="flex bg-slate-900 rounded-lg p-0.5 border border-white/10 text-xs">
            {['daily', 'weekly', 'monthly'].map((t) => (
              <button
                key={t}
                onClick={() => setTimeframe(t as any)}
                className={`px-3 py-1.5 font-medium rounded-md transition-colors ${timeframe === t ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                {t === 'daily' ? 'รายวัน' : t === 'weekly' ? 'รายสัปดาห์' : 'รายเดือน'}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-emerald-500/10 p-4 rounded-xl border border-emerald-500/20 text-center animate-in fade-in-30">
            <p className="text-xs text-emerald-400 mb-1">สแกนรับเข้าคลัง (IN)</p>
            <p className="text-3xl font-bold text-emerald-300 font-mono">{activeStats.in} <span className="text-sm font-normal">ชิ้น</span></p>
          </div>
          <div className="bg-rose-500/10 p-4 rounded-xl border border-rose-500/20 text-center animate-in fade-in-30">
            <p className="text-xs text-rose-400 mb-1">สแกนขายออกคลัง (OUT)</p>
            <p className="text-3xl font-bold text-rose-300 font-mono">{activeStats.out} <span className="text-sm font-normal">ชิ้น</span></p>
          </div>
        </div>
      </Card>

      {/* 2. Financial Control: Cost Summary per Lot */}
      <Card padding="md" className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            เงินทุนแบ่งตามล็อตสินค้า (Cost per Lot)
          </h3>
          <Button onClick={() => exportToCsv(costSummary, 'cost-summary-per-lot.csv')} size="sm" variant="secondary" className="min-h-[32px] text-xs">
            Export CSV
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-300">
            <thead className="text-xs text-indigo-300 uppercase bg-white/5">
              <tr>
                <th className="px-4 py-3">เลขล็อต (Lot Date)</th>
                <th className="px-4 py-3 text-right">จำนวนสินค้าพร้อมขาย</th>
                <th className="px-4 py-3 text-right">เงินทุนคงเหลือรวม</th>
              </tr>
            </thead>
            <tbody>
              {costSummary.map((row) => (
                <tr key={row.lot_date} className="border-b border-white/5 hover:bg-white/5">
                  <td className="px-4 py-3 font-medium text-white">{row.lot_date}</td>
                  <td className="px-4 py-3 text-right font-mono">{Number(row.total_items).toLocaleString()} ชิ้น</td>
                  <td className="px-4 py-3 text-right font-mono text-emerald-400 font-bold">
                    ฿{row.total_cost ? Number(row.total_cost).toLocaleString() : '0'}
                  </td>
                </tr>
              ))}
              {costSummary.length === 0 && (
                <tr>
                  <td colSpan={3} className="text-center py-4 text-slate-500">ไม่มีข้อมูลการเงินล็อต</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* 3. Lot-based & Location Tracking Table */}
      <Card padding="md" className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            พิกัดการจัดเก็บรายล็อต (Lot Location Tracking)
          </h3>
          <div className="flex items-center gap-2">
            <Button onClick={() => exportToCsv(filteredStock, 'lot-location-tracking.csv')} size="sm" variant="secondary" className="min-h-[32px] text-xs font-semibold py-1">
              Export CSV
            </Button>
          </div>
        </div>

        {/* Filter Input */}
        <Input 
          placeholder="🔍 ค้นหาตามเลขล็อต หรือ ชื่อแบรนด์/สินค้า..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-slate-900 border-white/10 text-sm"
        />

        <div className="overflow-x-auto max-h-[400px] overflow-y-auto pr-1">
          <table className="w-full text-xs text-left text-slate-300">
            <thead className="text-[10px] text-indigo-300 uppercase bg-slate-900 sticky top-0 z-10">
              <tr>
                <th className="px-3 py-2.5">ล็อต (Lot)</th>
                <th className="px-3 py-2.5">SKU</th>
                <th className="px-3 py-2.5">สินค้า (Name)</th>
                <th className="px-3 py-2.5">พิกัดชั้นวาง (Location)</th>
                <th className="px-3 py-2.5 text-right">จำนวนเก็บ</th>
              </tr>
            </thead>
            <tbody>
              {filteredStock.map((row, idx) => (
                <tr key={idx} className="border-b border-white/5 hover:bg-white/5">
                  <td className="px-3 py-2.5 font-bold font-mono text-indigo-300">{row.lot_date}</td>
                  <td className="px-3 py-2.5 font-mono">{row.sku}</td>
                  <td className="px-3 py-2.5 text-white truncate max-w-[120px]" title={row.name}>{row.name}</td>
                  <td className="px-3 py-2.5">
                    <span className="bg-indigo-500/10 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/20 font-bold font-mono text-[10px]">
                      {row.zone_name}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono font-bold text-white">{row.physical_qty} ชิ้น</td>
                </tr>
              ))}
              {filteredStock.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-4 text-slate-500">ไม่พบรายงานตรงกับการค้นหา</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
      
    </div>
  )
}
