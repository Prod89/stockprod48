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
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            สรุปการเคลื่อนไหวสต็อก (IN vs OUT)
          </h3>
          <div className="flex bg-slate-900 rounded-lg p-0.5 border border-white/10 text-xs self-start">
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

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-emerald-500/10 p-4 rounded-xl border border-emerald-500/20 text-center animate-in fade-in-30">
            <p className="text-[10px] text-emerald-400 mb-1 uppercase font-bold tracking-wider">รับเข้าคลัง (IN)</p>
            <p className="text-2xl font-bold text-emerald-300 font-mono">{activeStats.in} <span className="text-xs font-normal">ชิ้น</span></p>
          </div>
          <div className="bg-rose-500/10 p-4 rounded-xl border border-rose-500/20 text-center animate-in fade-in-30">
            <p className="text-[10px] text-rose-400 mb-1 uppercase font-bold tracking-wider">ขายออก (OUT)</p>
            <p className="text-2xl font-bold text-rose-300 font-mono">{activeStats.out} <span className="text-xs font-normal">ชิ้น</span></p>
          </div>
        </div>
      </Card>

      {/* 2. Financial Control: Cost Summary per Lot */}
      <Card padding="md" className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            เงินทุนแบ่งตามล็อต
          </h3>
          <Button onClick={() => exportToCsv(costSummary, 'cost-summary-per-lot.csv')} size="sm" variant="secondary" className="min-h-[40px] text-xs">
            Export CSV
          </Button>
        </div>

        {/* Mobile Card Layout for Cost Summary */}
        <div className="space-y-3">
          {costSummary.map((row) => (
            <div key={row.lot_date} className="bg-white/[0.03] border border-white/5 rounded-2xl p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">เลขล็อต (Lot Date)</span>
                <span className="font-mono text-indigo-300 font-bold bg-indigo-500/10 px-2 py-0.5 rounded text-sm">{row.lot_date}</span>
              </div>
              <div className="grid grid-cols-2 gap-3 bg-slate-950/50 p-3 rounded-xl border border-white/5">
                <div>
                  <p className="text-[10px] text-slate-500 mb-0.5">สินค้าพร้อมขาย</p>
                  <p className="text-sm font-bold text-white font-mono">{Number(row.total_items).toLocaleString()} <span className="text-xs font-normal text-slate-400">ชิ้น</span></p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-slate-500 mb-0.5">เงินทุนคงเหลือรวม</p>
                  <p className="text-base font-bold text-emerald-400 font-mono">฿{row.total_cost ? Number(row.total_cost).toLocaleString() : '0'}</p>
                </div>
              </div>
            </div>
          ))}
          {costSummary.length === 0 && (
            <p className="text-center py-4 text-slate-500 text-sm">ไม่มีข้อมูลการเงินล็อต</p>
          )}
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
            พิกัดการจัดเก็บรายล็อต
          </h3>
          <Button onClick={() => exportToCsv(filteredStock, 'lot-location-tracking.csv')} size="sm" variant="secondary" className="min-h-[40px] text-xs">
            Export CSV
          </Button>
        </div>

        {/* Filter Input */}
        <Input 
          placeholder="🔍 ค้นหาตามเลขล็อต หรือ ชื่อแบรนด์/สินค้า..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full"
        />
        <p className="text-xs text-slate-500">แสดง {filteredStock.length} รายการ</p>

        {/* Mobile Card Layout for Lot Location Tracking */}
        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
          {filteredStock.map((row, idx) => (
            <div key={idx} className="bg-white/[0.03] border border-white/5 rounded-2xl p-4 space-y-3">
              <div className="flex justify-between items-start gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs font-bold text-indigo-300 bg-indigo-500/10 px-1.5 py-0.5 rounded">{row.lot_date}</span>
                    <span className="font-mono text-sm text-white font-bold truncate">{row.sku}</span>
                  </div>
                  <p className="text-xs text-slate-400 truncate w-full" title={row.name}>{row.name}</p>
                </div>
                <div className="text-right flex-shrink-0 bg-slate-950 p-2 rounded-xl border border-white/5">
                  <p className="text-[10px] text-slate-500 mb-0.5">จำนวนเก็บ</p>
                  <p className="text-base font-bold text-emerald-400 font-mono">{row.physical_qty}</p>
                </div>
              </div>
              
              <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-2.5 flex items-center justify-between">
                <span className="text-xs text-indigo-300/70">พิกัดชั้นวาง (Location)</span>
                <span className="font-bold text-indigo-300 text-sm tracking-wide">{row.zone_name}</span>
              </div>
            </div>
          ))}
          {filteredStock.length === 0 && (
            <p className="text-center py-8 text-slate-500 text-sm">ไม่พบรายงานตรงกับการค้นหา</p>
          )}
        </div>
      </Card>
      
    </div>
  )
}
