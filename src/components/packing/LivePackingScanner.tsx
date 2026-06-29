'use client'

import { useState, useRef, useEffect, useTransition } from 'react'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { getProductInfo, directOutbound, directReturn } from '@/actions/fulfillment'

export function LivePackingScanner() {
  const [mode, setMode] = useState<'OUTBOUND' | 'RETURN'>('OUTBOUND')
  const [sku, setSku] = useState('')
  const [productInfo, setProductInfo] = useState<any | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [scannedList, setScannedList] = useState<{id: string, sku: string, name: string, time: string, type: string, cancelled?: boolean}[]>([])
  const [returnReason, setReturnReason] = useState('ลูกค้าเปลี่ยนใจ')
  
  const inputRef = useRef<HTMLInputElement>(null)
  const confirmBtnRef = useRef<HTMLButtonElement>(null)

  // Auto-focus input on mount and mode change
  useEffect(() => {
    inputRef.current?.focus()
    setSku('')
    setProductInfo(null)
    setError(null)
  }, [mode])

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
          setTimeout(() => confirmBtnRef.current?.focus(), 100)
        }
      })
    }
  }

  const handleConfirm = () => {
    if (!productInfo) return
    setError(null)
    startTransition(async () => {
      let result;
      if (mode === 'OUTBOUND') {
        result = await directOutbound(productInfo.product.sku, 1)
      } else {
        result = await directReturn(productInfo.product.sku, 1, returnReason)
      }

      if (result.error) {
        setError(result.error)
        confirmBtnRef.current?.focus()
      } else {
        // Success
        setScannedList(prev => [{
          id: crypto.randomUUID(),
          sku: productInfo.product.sku,
          name: productInfo.product.name,
          time: new Date().toLocaleTimeString('th-TH'),
          type: mode
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
    const headers = ['Time', 'Type', 'SKU', 'Product Name', 'Status']
    const rows = scannedList.map(item => [
      item.time,
      item.type,
      item.sku,
      `"${item.name}"`,
      item.cancelled ? 'Cancelled' : 'Completed'
    ].join(','))
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows].join('\n')
    const link = document.createElement('a')
    link.href = encodeURI(csvContent)
    link.download = `live-packing-${mode.toLowerCase()}-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  const handleUndo = (item: any) => {
    if (item.cancelled) return
    setError(null)
    startTransition(async () => {
      let result;
      if (item.type === 'OUTBOUND') {
        // Reverse OUTBOUND by returning it
        result = await directReturn(item.sku, 1, 'ยกเลิกการจัดส่ง (สแกนผิด)')
      } else {
        // Reverse RETURN by sending it out
        result = await directOutbound(item.sku, 1)
      }

      if (result.error) {
        setError('ยกเลิกไม่สำเร็จ: ' + result.error)
      } else {
        // Mark as cancelled in UI
        setScannedList(prev => prev.map(p => p.id === item.id ? { ...p, cancelled: true } : p))
        // Refocus input
        inputRef.current?.focus()
      }
    })
  }

  const isOutbound = mode === 'OUTBOUND'
  const themeColor = isOutbound ? 'emerald' : 'amber'

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          {isOutbound ? '📦 จัดแพ็คไลฟ์สด' : '🔄 รับคืนสินค้า'}
        </h2>
        <Button onClick={exportCsv} size="sm" variant="secondary" className="text-xs shrink-0">
          Export ยอดวันนี้
        </Button>
      </div>

      {/* Mode Toggle */}
      <div className="flex bg-slate-800 p-1 rounded-xl">
        <button 
          onClick={() => setMode('OUTBOUND')}
          className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
            isOutbound ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'text-slate-400 hover:text-white'
          }`}
        >
          ตัดสต็อก (ขายออก)
        </button>
        <button 
          onClick={() => setMode('RETURN')}
          className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
            !isOutbound ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' : 'text-slate-400 hover:text-white'
          }`}
        >
          คืนสต็อก (Return)
        </button>
      </div>

      <Card padding="lg" className={`space-y-6 bg-slate-900/80 border-${themeColor}-500/30`}>
        <div>
          <label className={`block text-sm font-bold mb-2 ${isOutbound ? 'text-emerald-200' : 'text-amber-200'}`}>
            สแกน SKU สินค้า {isOutbound ? 'เพื่อตัดยอดขาย' : 'เพื่อรับคืนเข้าสต็อก'}
          </label>
          <input
            ref={inputRef}
            type="text"
            value={sku}
            onChange={(e) => setSku(e.target.value)}
            onKeyDown={handleScan}
            disabled={isPending}
            placeholder="คลิกที่นี่แล้วสแกนบาร์โค้ด..."
            className={`w-full h-14 bg-slate-800 border-2 border-${themeColor}-500/50 rounded-xl px-4 text-xl text-white placeholder-slate-500 focus:outline-none focus:border-${themeColor}-400 focus:ring-4 focus:ring-${themeColor}-500/20 transition-all font-mono`}
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
                <p className="text-xs text-slate-400 mb-1">สต็อกปัจจุบัน (คงเหลือ)</p>
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

            {!isOutbound && (
              <div>
                <label className="text-xs text-slate-400 block mb-1">เหตุผลการคืนสินค้า</label>
                <select 
                  value={returnReason} 
                  onChange={e => setReturnReason(e.target.value)}
                  className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="ลูกค้าเปลี่ยนใจ">ลูกค้าเปลี่ยนใจ</option>
                  <option value="สินค้ามีตำหนิ">สินค้ามีตำหนิ</option>
                  <option value="สแกนผิดพลาด">สแกนผิดพลาด / ยกเลิกก่อนส่ง</option>
                  <option value="อื่นๆ">อื่นๆ</option>
                </select>
              </div>
            )}

            <Button 
              ref={confirmBtnRef}
              onClick={handleConfirm}
              disabled={isPending || (isOutbound && productInfo.total_qty <= 0)}
              className={`w-full h-16 text-xl font-bold shadow-lg transition-transform active:scale-95 ${
                isOutbound 
                  ? productInfo.total_qty > 0 
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white shadow-emerald-500/20'
                    : 'bg-slate-700 text-slate-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white shadow-amber-500/20'
              }`}
            >
              {isPending ? 'กำลังประมวลผล...' : isOutbound ? 'ยืนยันการจัดส่ง (หัก 1 ชิ้น)' : 'ยืนยันการคืน (เพิ่ม 1 ชิ้น)'}
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
              <div key={idx} className={`bg-slate-800/50 p-3 rounded-lg border flex items-center justify-between ${
                item.type === 'OUTBOUND' ? 'border-emerald-500/10' : 'border-amber-500/10'
              }`}>
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-bold font-mono ${item.type === 'OUTBOUND' ? 'text-emerald-300' : 'text-amber-300'}`}>
                    {item.sku}
                  </p>
                  <p className="text-xs text-white truncate pr-2">{item.name}</p>
                </div>
                <div className="text-right shrink-0">
                  {item.cancelled ? (
                    <span className="text-xs font-bold px-2 py-1 rounded text-slate-400 bg-slate-800 line-through border border-white/10">
                      ถูกยกเลิก
                    </span>
                  ) : (
                    <div className="flex flex-col items-end gap-1.5">
                      <span className={`text-xs font-bold px-2 py-1 rounded ${
                        item.type === 'OUTBOUND' ? 'text-emerald-400 bg-emerald-500/10' : 'text-amber-400 bg-amber-500/10'
                      }`}>
                        {item.type === 'OUTBOUND' ? '✓ จัดส่งแล้ว' : '↩ รับคืนแล้ว'}
                      </span>
                      <button 
                        onClick={() => handleUndo(item)}
                        disabled={isPending}
                        className="text-[10px] text-red-400 hover:text-red-300 underline underline-offset-2 transition-colors disabled:opacity-50"
                      >
                        สแกนผิด (ยกเลิก)
                      </button>
                    </div>
                  )}
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
