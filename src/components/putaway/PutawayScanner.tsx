'use client'

import { useState } from 'react'
import { BarcodeInput } from '../inbound/BarcodeInput'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { Input } from '../ui/Input'
import { moveStock } from '@/actions/fulfillment'
import { useRouter } from 'next/navigation'

export function PutawayScanner({ products, locations }: { products: any[], locations: any[] }) {
  const router = useRouter()
  const [step, setStep] = useState<'scan-product' | 'scan-location' | 'confirm'>('scan-product')
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null)
  const [selectedLocation, setSelectedLocation] = useState<any | null>(null)
  const [quantity, setQuantity] = useState<number>(1)
  const [reasonCode, setReasonCode] = useState<string>('MOVE_TO_SHELF')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleProductScan = (sku: string) => {
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
    setSelectedProduct(product)
    setStep('scan-location')
  }

  const handleLocationScan = (barcode: string) => {
    const location = locations.find(l => l.barcode_ref === barcode)
    if (!location) {
      setError(`ไม่พบพิกัดรหัส ${barcode}`)
      return
    }
    setError(null)
    setSelectedLocation(location)
    setStep('confirm')
  }

  const handleConfirm = async () => {
    if (!selectedProduct || !selectedLocation || quantity < 1 || !reasonCode) {
      setError('กรุณากรอกข้อมูลให้ครบถ้วน')
      return
    }

    setLoading(true)
    setError(null)

    const result = await moveStock(selectedProduct.id, selectedLocation.id, quantity, reasonCode)

    setLoading(false)

    if (result.error) {
      setError(result.error)
    } else {
      // Success, reset form
      setSelectedProduct(null)
      setSelectedLocation(null)
      setQuantity(1)
      setStep('scan-product')
      router.refresh()
    }
  }

  return (
    <div className="space-y-6">
      
      {/* Progress Indicator */}
      <div className="flex items-center justify-between px-2 mb-8">
        <div className={`flex flex-col items-center gap-2 ${step === 'scan-product' ? 'text-indigo-400' : 'text-slate-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step === 'scan-product' ? 'bg-indigo-500/20 border-2 border-indigo-500' : 'bg-slate-800'}`}>1</div>
          <span className="text-xs">สแกนสินค้า</span>
        </div>
        <div className="flex-1 h-px bg-slate-700 mx-2"></div>
        <div className={`flex flex-col items-center gap-2 ${step === 'scan-location' ? 'text-indigo-400' : 'text-slate-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step === 'scan-location' ? 'bg-indigo-500/20 border-2 border-indigo-500' : 'bg-slate-800'}`}>2</div>
          <span className="text-xs">สแกนพิกัด</span>
        </div>
        <div className="flex-1 h-px bg-slate-700 mx-2"></div>
        <div className={`flex flex-col items-center gap-2 ${step === 'confirm' ? 'text-indigo-400' : 'text-slate-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step === 'confirm' ? 'bg-indigo-500/20 border-2 border-indigo-500' : 'bg-slate-800'}`}>3</div>
          <span className="text-xs">ยืนยัน</span>
        </div>
      </div>

      <Card padding="md" className="space-y-4 min-h-[200px]">
        {step === 'scan-product' && (
          <div className="space-y-4 animate-in fade-in">
            <label className="block text-sm font-medium text-slate-300">
              1. สแกนบาร์โค้ดสินค้าที่ต้องการย้าย
            </label>
            <BarcodeInput onScan={handleProductScan} />
            <p className="text-xs text-slate-500 text-center mt-4">
              เคล็ดลับ: สแกนสินค้าที่อยู่ใน ZONE-RETURN เพื่อนำกลับเข้าชั้นวาง
            </p>
          </div>
        )}

        {step === 'scan-location' && (
          <div className="space-y-4 animate-in slide-in-from-right-4">
            <div className="bg-slate-900/50 p-3 rounded-xl border border-white/5 mb-6">
              <p className="text-sm text-slate-400">สินค้าที่เลือก:</p>
              <p className="text-white font-medium">{selectedProduct?.name}</p>
              <p className="text-xs text-indigo-400">SKU: {selectedProduct?.sku}</p>
            </div>

            <label className="block text-sm font-medium text-slate-300">
              2. สแกนบาร์โค้ดพิกัดปลายทาง
            </label>
            <BarcodeInput onScan={handleLocationScan} />
            
            <Button variant="ghost" onClick={() => setStep('scan-product')} className="w-full mt-4 text-slate-400">
              ย้อนกลับ
            </Button>
          </div>
        )}

        {step === 'confirm' && (
          <div className="space-y-6 animate-in slide-in-from-right-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-900/50 p-3 rounded-xl border border-white/5">
                <p className="text-xs text-slate-400 mb-1">สินค้า</p>
                <p className="text-sm text-white font-medium truncate">{selectedProduct?.name}</p>
              </div>
              <div className="bg-slate-900/50 p-3 rounded-xl border border-indigo-500/30">
                <p className="text-xs text-slate-400 mb-1">พิกัดปลายทาง</p>
                <p className="text-sm text-indigo-400 font-bold">{selectedLocation?.zone_name}</p>
              </div>
            </div>

            <Input
              type="number"
              label="จำนวนที่ย้าย (ชิ้น)"
              min={1}
              value={quantity || ''}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
            />

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-300">เหตุผลการย้าย (Reason Code)</label>
              <select 
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={reasonCode}
                onChange={(e) => setReasonCode(e.target.value)}
              >
                <option value="MOVE_TO_SHELF">ย้ายเข้าชั้นวาง (Move to Shelf)</option>
                <option value="WRONG_GRADE">เปลี่ยนเกรด (Wrong Grade)</option>
                <option value="DAMAGED">สินค้าเสียหาย (Damaged)</option>
                <option value="STOCK_TAKE">นับสต็อกใหม่ (Stock Take)</option>
              </select>
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="secondary" onClick={() => setStep('scan-location')} className="flex-1">
                ย้อนกลับ
              </Button>
              <Button onClick={handleConfirm} isLoading={loading} className="flex-[2]">
                ยืนยันการย้าย
              </Button>
            </div>
          </div>
        )}
        
        {error && <p className="text-red-400 text-sm text-center mt-4">{error}</p>}
      </Card>
    </div>
  )
}
