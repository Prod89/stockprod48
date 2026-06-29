'use client'

import { useState, useRef, useEffect, useTransition } from 'react'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { getProductInfo, directOutbound } from '@/actions/fulfillment'

export function LivePackingScanner() {
  const [sku, setSku] = useState('')
  const [productInfo, setProductInfo] = useState<any | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [scannedList, setScannedList] = useState<{sku: string, name: string, time: string}[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const confirmBtnRef = useRef<HTMLButtonElement>(null)

  // Auto-focus input on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleScan = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && sku.trim()) {
      e.preventDefault()
      setError(null)
      startTransition(async () => {
        const info = await getProductInfo(sku.trim())
        if (info.error) {
          setError(info.error)
          setProductInfo(null)
          setSku('')
          inputRef.current?.focus()
        } else {
          setProductInfo(info)
          // focus confirm button
          setTimeout(() => confirmBtnRef.current?.focus(), 100)
        }
      })
    }
  }

  const handleConfirm = () => {
    if (!productInfo) return
    setError(null)
    startTransition(async () => {
      const result = await directOutbound(productInfo.product.sku, 1)
      if (result.error) {
        setError(result.error)
        // Keep focus on confirm button if error (e.g. out of stock)
        confirmBtnRef.current?.focus()
      } else {
        // Success
        setScannedList(prev => [{
          sku: productInfo.product.sku,
          name: productInfo.product.name,
          time: new Date().toLocaleTimeString('th-TH')
        }, ...prev])
        
        // Reset and refocus
        setProductInfo(null)
        setSku('')
        inputRef.current?.focus()
      }
    })
  }

  const exportCsv = () => {
    if (scannedList.length === 0) return
    const headers = ['Time', 'SKU', 'Product Name']
    const rows = scannedList.map(item => [
      item.time,
      item.sku,
      `"${item.name}"`
    ].join(','))
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows].join('\n')
    const link = document.createElement('a')
    link.href = encodeURI(csvContent)
    link.download = `live-packing-outbound-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <svg className="w-6 h-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
          </svg>
          จัดแพ็คไลฟ์สด (Direct Outbound)
        </h2>
        <Button onClick={exportCsv} size="sm" variant="secondary" className="text-xs shrink-0">
          Export ยอดวันนี้
        </Button>
      </div>

      <Card padding="lg" className="space-y-6 bg-slate-900/80 border-indigo-500/20">
        <div>
          <label className="block text-sm font-bold text-indigo-200 mb-2">
            สแกน SKU สินค้า
          </label>
          <input
            ref={inputRef}
            type="text"
            value={sku}
            onChange={(e) => setSku(e.target.value)}
            onKeyDown={handleScan}
            disabled={isPending}
            placeholder="คลิกที่นี่แล้วสแกนบาร์โค้ด..."
            className="w-full h-14 bg-slate-800 border-2 border-indigo-500/50 rounded-xl px-4 text-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/20 transition-all font-mono"
            autoComplete="off"
            autoFocus
          />
          {error && (
            <div className="mt-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-2 text-red-400">
              <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span className="text-sm font-bold">{error}</span>
            </div>
          )}
        </div>

        {productInfo && (
          <div className="pt-4 border-t border-white/10 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div>
              <p className="text-sm text-slate-400">ชื่อสินค้า:</p>
              <p className="text-xl font-bold text-white leading-tight">{productInfo.product.name}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-800 rounded-xl p-3 border border-white/5">
                <p className="text-xs text-slate-400 mb-1">สถานะคงเหลือ</p>
                <div className="flex items-baseline gap-2">
                  <span className={`text-2xl font-bold font-mono ${productInfo.total_qty > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {productInfo.total_qty}
                  </span>
                  <span className="text-xs text-slate-500">ชิ้น</span>
                </div>
              </div>
              <div className="bg-slate-800 rounded-xl p-3 border border-white/5">
                <p className="text-xs text-slate-400 mb-1">ตำแหน่ง (Locations)</p>
                <div className="space-y-1">
                  {productInfo.locations?.map((l: any, i: number) => (
                    <div key={i} className="flex justify-between text-xs">
                      <span className="text-slate-300 truncate max-w-[80px]">{l.zone}</span>
                      <span className="text-indigo-300 font-mono">{l.qty}</span>
                    </div>
                  ))}
                  {(!productInfo.locations || productInfo.locations.length === 0) && (
                    <span className="text-xs text-red-400">Out of Stock</span>
                  )}
                </div>
              </div>
            </div>

            <Button 
              ref={confirmBtnRef}
              onClick={handleConfirm}
              disabled={isPending || productInfo.total_qty <= 0}
              className={`w-full h-16 text-xl font-bold shadow-lg transition-transform active:scale-95 ${
                productInfo.total_qty > 0 
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white shadow-emerald-500/20'
                  : 'bg-slate-700 text-slate-400 cursor-not-allowed'
              }`}
            >
              {isPending ? 'กำลังตัดสต็อก...' : 'ยืนยันการจัดส่ง (ตัดสต็อก 1 ชิ้น)'}
            </Button>
          </div>
        )}
      </Card>

      {/* Scanned History Today */}
      {scannedList.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-400">ประวัติการสแกนรอบนี้ ({scannedList.length} รายการ)</h3>
          <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
            {scannedList.map((item, idx) => (
              <div key={idx} className="bg-slate-800/50 p-3 rounded-lg border border-white/5 flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-indigo-300 font-mono">{item.sku}</p>
                  <p className="text-xs text-white truncate pr-2">{item.name}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs text-emerald-400 font-bold bg-emerald-500/10 px-2 py-1 rounded">✓ จัดส่งแล้ว</span>
                  <p className="text-[10px] text-slate-500 mt-1">{item.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
