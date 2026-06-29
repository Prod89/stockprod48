'use client'

import { useState, useTransition } from 'react'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { saveBaleCost } from '@/actions/owner'

interface BaleCostManagerProps {
  baleHistory: any[]
}

export function BaleCostManager({ baleHistory }: BaleCostManagerProps) {
  const [showForm, setShowForm] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [formState, setFormState] = useState({
    lot_date: '', bale_cost: '', shipping_cost: '', misc_cost: '', total_units: '', notes: ''
  })
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

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

  const handleSubmit = () => {
    if (!formState.lot_date || !formState.bale_cost || !formState.total_units) {
      setMessage({ type: 'error', text: 'กรุณากรอกข้อมูลให้ครบ (ล็อต, ต้นทุนกระสอบ, จำนวนชิ้น)' })
      return
    }
    startTransition(async () => {
      const result = await saveBaleCost({
        lot_date: formState.lot_date,
        bale_cost: Number(formState.bale_cost),
        shipping_cost: Number(formState.shipping_cost) || 0,
        misc_cost: Number(formState.misc_cost) || 0,
        total_units: Number(formState.total_units),
        notes: formState.notes
      })
      if (result.error) {
        setMessage({ type: 'error', text: result.error })
      } else {
        setMessage({ type: 'success', text: 'บันทึกต้นทุนกระสอบสำเร็จ!' })
        setFormState({ lot_date: '', bale_cost: '', shipping_cost: '', misc_cost: '', total_units: '', notes: '' })
        setShowForm(false)
      }
    })
  }

  return (
    <Card padding="md" className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          บันทึกต้นทุนกระสอบ (Bale Cost Log)
        </h3>
        <div className="flex gap-2">
          <Button onClick={() => exportToCsv(baleHistory, 'bale-cost-history.csv')} size="sm" variant="secondary" className="text-xs min-h-[32px]">
            Export
          </Button>
          <Button onClick={() => setShowForm(!showForm)} size="sm" className="text-xs min-h-[32px]">
            {showForm ? 'ปิด' : '+ เพิ่มล็อต'}
          </Button>
        </div>
      </div>

      {message && (
        <div className={`p-3 rounded-lg text-sm font-medium ${message.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
          {message.text}
        </div>
      )}

      {showForm && (
        <div className="bg-slate-900 p-4 rounded-xl border border-white/10 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 block mb-1">เลขล็อต *</label>
              <input type="text" placeholder="เช่น 2025-06-15" value={formState.lot_date} onChange={e => setFormState(s => ({ ...s, lot_date: e.target.value }))}
                className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">จำนวนชิ้นรวม *</label>
              <input type="number" min="1" placeholder="เช่น 150" value={formState.total_units} onChange={e => setFormState(s => ({ ...s, total_units: e.target.value }))}
                className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-slate-400 block mb-1">ค่ากระสอบ (฿) *</label>
              <input type="number" min="0" step="0.01" placeholder="0.00" value={formState.bale_cost} onChange={e => setFormState(s => ({ ...s, bale_cost: e.target.value }))}
                className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">ค่าขนส่ง (฿)</label>
              <input type="number" min="0" step="0.01" placeholder="0.00" value={formState.shipping_cost} onChange={e => setFormState(s => ({ ...s, shipping_cost: e.target.value }))}
                className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">ค่าใช้จ่ายอื่น (฿)</label>
              <input type="number" min="0" step="0.01" placeholder="0.00" value={formState.misc_cost} onChange={e => setFormState(s => ({ ...s, misc_cost: e.target.value }))}
                className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1">บันทึกเพิ่มเติม</label>
            <input type="text" placeholder="เช่น ล็อตเกรด A+B mixed" value={formState.notes} onChange={e => setFormState(s => ({ ...s, notes: e.target.value }))}
              className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
          </div>
          <Button onClick={handleSubmit} disabled={isPending} className="w-full">
            {isPending ? (
              <span className="flex items-center gap-2 justify-center"><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> กำลังบันทึก...</span>
            ) : '💾 บันทึกต้นทุนกระสอบ'}
          </Button>
        </div>
      )}

      {/* History Cards (Mobile First) */}
      {baleHistory.length > 0 && (
        <div className="space-y-3 mt-4">
          <p className="text-xs text-slate-500">ประวัติการบันทึก ({baleHistory.length} รายการ)</p>
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
            {baleHistory.map((row: any) => (
              <div key={row.id} className="bg-white/[0.03] border border-white/5 rounded-2xl p-4 flex flex-col gap-3">
                <div className="flex justify-between items-center border-b border-white/5 pb-3">
                  <span className="font-mono text-sm font-bold text-indigo-300 bg-indigo-500/10 px-2 py-1 rounded">Lot: {row.lot_date}</span>
                  <span className="text-xs text-slate-400 font-mono">{row.total_units} ชิ้น</span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-slate-950/50 p-2 rounded-lg text-center border border-white/5">
                    <p className="text-[10px] text-slate-500 mb-0.5">ค่ากระสอบ</p>
                    <p className="text-xs font-bold text-slate-300 font-mono">฿{Number(row.bale_cost).toLocaleString()}</p>
                  </div>
                  <div className="bg-slate-950/50 p-2 rounded-lg text-center border border-white/5">
                    <p className="text-[10px] text-slate-500 mb-0.5">ค่าขนส่ง</p>
                    <p className="text-xs font-bold text-slate-300 font-mono">฿{Number(row.shipping_cost).toLocaleString()}</p>
                  </div>
                  <div className="bg-slate-950/50 p-2 rounded-lg text-center border border-white/5">
                    <p className="text-[10px] text-slate-500 mb-0.5">ค่าอื่นๆ</p>
                    <p className="text-xs font-bold text-slate-300 font-mono">฿{Number(row.misc_cost).toLocaleString()}</p>
                  </div>
                </div>

                <div className="flex justify-between items-center bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-xl">
                  <span className="text-xs text-emerald-400/80">ต้นทุนเฉลี่ย/ชิ้น</span>
                  <span className="font-bold text-emerald-400 text-sm font-mono tracking-wide">฿{Number(row.avg_unit_cost).toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  )
}
