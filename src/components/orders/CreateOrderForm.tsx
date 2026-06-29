'use client'

import { useState } from 'react'
import { BarcodeInput } from '../inbound/BarcodeInput'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { Input } from '../ui/Input'
import { createOrder } from '@/actions/orders'
import { useRouter } from 'next/navigation'

interface StockItem {
  product_id: string
  sku: string
  name: string
  available_qty: number
}

interface CartItem extends StockItem {
  ordered_qty: number
  selling_price: number
}

export function CreateOrderForm({ initialStockData }: { initialStockData: StockItem[] }) {
  const router = useRouter()
  const [customerName, setCustomerName] = useState('')
  const [cart, setCart] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleScan = (sku: string) => {
    const product = initialStockData.find(p => p.sku === sku)
    if (!product) {
      setError(`ไม่พบสินค้ารหัส ${sku}`)
      return
    }
    if (product.available_qty <= 0) {
      setError(`สต็อกสินค้า ${sku} หมดแล้ว (Available: 0)`)
      return
    }
    
    setError(null)
    setCart(prev => {
      const existing = prev.find(item => item.product_id === product.product_id)
      if (existing) {
        if (existing.ordered_qty >= product.available_qty) {
          setError(`สต็อกสินค้า ${sku} ไม่เพียงพอ (สูงสุด: ${product.available_qty})`)
          return prev
        }
        return prev.map(item => 
          item.product_id === product.product_id 
            ? { ...item, ordered_qty: item.ordered_qty + 1 }
            : item
        )
      }
      return [...prev, { ...product, ordered_qty: 1, selling_price: 0 }]
    })
  }

  const updateCartItem = (productId: string, field: 'ordered_qty' | 'selling_price', value: number) => {
    setCart(prev => prev.map(item => {
      if (item.product_id === productId) {
        if (field === 'ordered_qty') {
          if (value > item.available_qty) {
            setError(`สต็อกไม่พอ (สูงสุด: ${item.available_qty})`)
            return item
          }
        }
        return { ...item, [field]: value }
      }
      return item
    }))
  }

  const removeCartItem = (productId: string) => {
    setCart(prev => prev.filter(item => item.product_id !== productId))
  }

  const handleSubmit = async () => {
    if (!customerName.trim()) {
      setError('กรุณาระบุชื่อลูกค้าหรือรหัส CF')
      return
    }
    if (cart.length === 0) {
      setError('กรุณาเพิ่มสินค้าลงในออเดอร์')
      return
    }
    
    setLoading(true)
    setError(null)

    const result = await createOrder(
      customerName,
      cart.map(item => ({
        product_id: item.product_id,
        ordered_qty: item.ordered_qty,
        selling_price: item.selling_price
      }))
    )

    setLoading(false)

    if (result.error) {
      setError(result.error)
    } else {
      router.push('/orders')
    }
  }

  const totalAmount = cart.reduce((sum, item) => sum + (item.ordered_qty * item.selling_price), 0)

  return (
    <div className="space-y-6">
      <Input
        label="ชื่อลูกค้า / รหัส CF"
        placeholder="เช่น FB-JohnDoe หรือ CF-001"
        value={customerName}
        onChange={(e) => setCustomerName(e.target.value)}
      />

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          สแกน SKU เพื่อเพิ่มลงตะกร้า
        </label>
        <BarcodeInput onScan={handleScan} />
        {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
      </div>

      <div className="space-y-3">
        <h3 className="text-white font-medium">รายการสินค้า ({cart.length})</h3>
        {cart.map((item) => (
          <Card key={item.product_id} padding="md" className="space-y-3 relative overflow-hidden">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-white font-medium">{item.name}</p>
                <p className="text-sm text-slate-400">SKU: {item.sku}</p>
                <p className="text-xs text-indigo-400 mt-1">
                  Available: {item.available_qty}
                </p>
              </div>
              <button onClick={() => removeCartItem(item.product_id)} className="p-2 text-slate-400 hover:text-red-400">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <Input
                type="number"
                label="จำนวน (ชิ้น)"
                min={1}
                max={item.available_qty}
                value={item.ordered_qty || ''}
                onChange={(e) => updateCartItem(item.product_id, 'ordered_qty', parseInt(e.target.value) || 0)}
              />
              <Input
                type="number"
                label="ราคาขาย (บาท)"
                min={0}
                value={item.selling_price || ''}
                onChange={(e) => updateCartItem(item.product_id, 'selling_price', parseInt(e.target.value) || 0)}
              />
            </div>
          </Card>
        ))}
        {cart.length === 0 && (
          <div className="text-center py-6 text-slate-500 border border-dashed border-white/10 rounded-2xl">
            ยังไม่มีสินค้าในตะกร้า
          </div>
        )}
      </div>

      {cart.length > 0 && (
        <div className="bg-slate-900/80 p-4 rounded-2xl border border-white/5 flex justify-between items-center shadow-lg">
          <span className="text-slate-300">ยอดรวม</span>
          <span className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">
            ฿{totalAmount.toLocaleString()}
          </span>
        </div>
      )}

      <Button onClick={handleSubmit} isLoading={loading} className="w-full mt-4 h-12 text-lg">
        ยืนยันออเดอร์
      </Button>
    </div>
  )
}
