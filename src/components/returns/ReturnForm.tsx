'use client'

import { useState } from 'react'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { Input } from '../ui/Input'
import { Badge } from '../ui/Badge'
import { handleReturn } from '@/actions/fulfillment'

export function ReturnForm({ orders }: { orders: any[] }) {
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null)
  const [returnItems, setReturnItems] = useState<{ [itemId: string]: number }>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSelectOrder = (order: any) => {
    setSelectedOrder(order)
    setReturnItems({})
    setError(null)
    setSuccess(false)
  }

  const updateReturnQty = (itemId: string, maxQty: number, qty: number) => {
    if (qty > maxQty) {
      setError(`จำนวนคืนต้องไม่เกิน ${maxQty}`)
      return
    }
    setError(null)
    setReturnItems(prev => ({
      ...prev,
      [itemId]: qty
    }))
  }

  const handleConfirm = async () => {
    if (!selectedOrder) return
    
    // Check if at least one item has return quantity > 0
    const hasReturns = Object.values(returnItems).some(qty => qty > 0)
    if (!hasReturns) {
      setError('กรุณาระบุจำนวนสินค้าที่คืนอย่างน้อย 1 ชิ้น')
      return
    }

    setLoading(true)
    setError(null)
    
    const payload = Object.entries(returnItems)
      .filter(([_, qty]) => qty > 0)
      .map(([itemId, qty]) => {
        const item = selectedOrder.order_items.find((i: any) => i.id === itemId)
        return {
          id: itemId,
          product_id: item.product_id,
          returned_qty: qty
        }
      })

    const result = await handleReturn(selectedOrder.id, payload)
    
    setLoading(false)
    if (result.error) {
      setError(result.error)
    } else {
      setSuccess(true)
      setTimeout(() => {
        window.location.reload()
      }, 1500)
    }
  }

  if (success) {
    return (
      <Card className="p-8 text-center flex flex-col items-center gap-4">
        <div className="w-16 h-16 bg-blue-500/20 text-blue-500 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-white">บันทึกของตีกลับสำเร็จ!</h3>
        <p className="text-slate-400">สินค้าถูกย้ายไปที่ ZONE-RETURN เรียบร้อยแล้ว</p>
      </Card>
    )
  }

  if (!selectedOrder) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-medium text-white">เลือกออเดอร์ที่ถูกตีกลับ</h2>
        <p className="text-sm text-slate-400 mb-4">ระบบจะแสดงเฉพาะออเดอร์ที่อยู่ในสถานะ SHIPPED เท่านั้น</p>
        
        {orders.map(order => (
          <Card 
            key={order.id} 
            padding="md" 
            className="cursor-pointer hover:border-indigo-500/50 transition-colors"
            onClick={() => handleSelectOrder(order)}
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium text-white">{order.customer_name}</h3>
                <p className="text-sm text-slate-400 mt-1">ออเดอร์ ID: {order.id.slice(0, 8)}</p>
              </div>
              <Badge variant="success">{order.status}</Badge>
            </div>
          </Card>
        ))}
        {orders.length === 0 && (
          <div className="text-center py-10 text-slate-400">ไม่มีออเดอร์สถานะจัดส่งแล้วในระบบ</div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium text-white">
          ออเดอร์: <span className="text-indigo-400">{selectedOrder.customer_name}</span>
        </h2>
        <button onClick={() => setSelectedOrder(null)} className="text-sm text-slate-400 hover:text-white">
          เปลี่ยนออเดอร์
        </button>
      </div>

      <div className="space-y-4">
        <p className="text-sm text-amber-400 bg-amber-400/10 p-3 rounded-lg border border-amber-400/20">
          คำเตือน: สินค้าที่รับคืนจะถูกส่งเข้าไปที่พิกัด <strong>ZONE-RETURN</strong> อัตโนมัติ กรุณานำของไปพักไว้ที่โซนดังกล่าวก่อน
        </p>

        {selectedOrder.order_items.map((item: any) => (
          <Card key={item.id} padding="md" className="space-y-3">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-white font-medium">{item.product.name}</p>
                <p className="text-sm text-slate-400">SKU: {item.product.sku}</p>
                <p className="text-xs text-indigo-400 mt-1">จำนวนที่ส่งไป: {item.shipped_qty}</p>
              </div>
              <div className="w-32">
                <Input
                  type="number"
                  label="จำนวนที่คืน"
                  min={0}
                  max={item.shipped_qty}
                  value={returnItems[item.id] === undefined ? '' : returnItems[item.id]}
                  onChange={(e) => updateReturnQty(item.id, item.shipped_qty, parseInt(e.target.value) || 0)}
                  placeholder="0"
                />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {error && <p className="text-red-400 text-sm text-center">{error}</p>}

      <div className="fixed bottom-[80px] left-0 right-0 p-4 bg-slate-900/90 backdrop-blur-xl border-t border-white/5">
        <Button 
          onClick={handleConfirm} 
          isLoading={loading}
          variant="secondary"
          className="w-full h-14 text-lg shadow-lg border-indigo-500 text-indigo-400"
        >
          ยืนยันรับของตีกลับ
        </Button>
      </div>
    </div>
  )
}
