'use client'

import { useState } from 'react'
import { BarcodeInput } from '../inbound/BarcodeInput'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { adjustStock } from '@/actions/stockTakeAction'

export function StockTakeScanner({ products, locations, stockView }: { products: any[], locations: any[], stockView: any[] }) {
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null)
  const [actualQty, setActualQty] = useState<number | ''>('')
  const [locationId, setLocationId] = useState<string>('')
  const [reasonCode, setReasonCode] = useState<string>('STOCK_TAKE')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const handleScan = (sku: string) => {
    let product = products.find(p => p.sku?.toLowerCase() === sku.toLowerCase())
    if (!product) {
      const matches = products.filter(
        (p) => p.sku?.toLowerCase().includes(sku.toLowerCase()) ||
               p.name?.toLowerCase().includes(sku.toLowerCase())
      )
      if (matches.length > 0) {
        product = matches[0]
      }
    }

    if (!product) {
      setError(`ไม่พบสินค้าใกล้เคียงกับรหัส ${sku}`)
      return
    }
    setError(null)
    setSuccessMsg(null)
    setSelectedProduct(product)
    setActualQty('')
  }

  const expectedQty = selectedProduct 
    ? (stockView.find(s => s.product_id === selectedProduct.id)?.physical_qty || 0)
    : 0

  const diffQty = typeof actualQty === 'number' ? actualQty - expectedQty : 0

  const handleSubmit = async () => {
    if (!selectedProduct || typeof actualQty !== 'number' || !locationId || !reasonCode) {
      setError('กรุณากรอกข้อมูลให้ครบถ้วน')
      return
    }

    if (diffQty === 0) {
      setError('ยอดตรงกัน ไม่มีการปรับสต็อก')
      return
    }

    setLoading(true)
    setError(null)

    const result = await adjustStock(selectedProduct.id, locationId, diffQty, reasonCode)
    
    setLoading(false)
    if (result.error) {
      setError(result.error)
    } else {
      setSuccessMsg(`ปรับยอดสำเร็จ (Adjust: ${diffQty > 0 ? '+' : ''}${diffQty})`)
      setSelectedProduct(null)
      setActualQty('')
    }
  }

  return (
    <div className="space-y-6">
      <Card padding="md" className="space-y-4">
        <label className="block text-sm font-medium text-slate-300">สแกน SKU สินค้าที่ต้องการเช็ค</label>
        <BarcodeInput onScan={handleScan} />
        {error && <p className="text-red-400 text-sm text-center">{error}</p>}
        {successMsg && <p className="text-green-400 text-sm text-center">{successMsg}</p>}
      </Card>

      {selectedProduct && (
        <Card padding="md" className="space-y-4 animate-in slide-in-from-bottom-4">
          <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5">
            <p className="text-white font-medium text-lg">{selectedProduct.name}</p>
            <p className="text-sm text-indigo-400 font-mono">SKU: {selectedProduct.sku}</p>
          </div>

          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
              <p className="text-sm text-slate-400 mb-1">ยอดในระบบ</p>
              <p className="text-3xl font-bold text-white">{expectedQty}</p>
            </div>
            <div className={`p-4 rounded-xl border ${diffQty === 0 ? 'border-slate-700 bg-slate-800' : diffQty > 0 ? 'border-green-500/30 bg-green-500/10' : 'border-red-500/30 bg-red-500/10'}`}>
              <p className="text-sm text-slate-400 mb-1">ผลต่าง</p>
              <p className={`text-3xl font-bold ${diffQty === 0 ? 'text-slate-500' : diffQty > 0 ? 'text-green-400' : 'text-red-400'}`}>
                {typeof actualQty === 'number' ? (diffQty > 0 ? `+${diffQty}` : diffQty) : '-'}
              </p>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-white/10">
            <Input
              type="number"
              label="ยอดที่นับได้จริง (นับมือ)"
              min={0}
              value={actualQty}
              onChange={(e) => setActualQty(e.target.value === '' ? '' : parseInt(e.target.value))}
              placeholder="กรอกจำนวนที่นับได้"
            />

            <Select
              label="ตำแหน่ง (Location)"
              options={locations.map(l => ({ value: l.id, label: `${l.zone_name} (${l.barcode_ref})` }))}
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
            />

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-300">เหตุผลการปรับปรุง (Reason Code)</label>
              <select 
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={reasonCode}
                onChange={(e) => setReasonCode(e.target.value)}
              >
                <option value="STOCK_TAKE">นับสต็อกใหม่ (Stock Take)</option>
                <option value="DAMAGED">สินค้าเสียหาย (Damaged)</option>
                <option value="WRONG_GRADE">เปลี่ยนเกรด (Wrong Grade)</option>
                <option value="EXPIRED">สินค้าหมดอายุ (Expired)</option>
              </select>
            </div>

            <Button 
              onClick={handleSubmit} 
              isLoading={loading}
              disabled={diffQty === 0 || typeof actualQty !== 'number'}
              className={`w-full h-14 text-lg ${diffQty !== 0 ? 'bg-amber-600 hover:bg-amber-700 text-white' : ''}`}
            >
              ปรับปรุงสต็อก (Adjust)
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}
