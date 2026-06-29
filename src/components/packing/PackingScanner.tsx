'use client'

import { useState } from 'react'
import { BarcodeInput } from '../inbound/BarcodeInput'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { Badge } from '../ui/Badge'
import { confirmShipping, returnOrderToStock } from '@/actions/fulfillment'
import { jsPDF } from 'jspdf'

export function PackingScanner({ orders }: { orders: any[] }) {
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null)
  const [scannedItems, setScannedItems] = useState<{ [productId: string]: number }>({})
  const [loading, setLoading] = useState(false)
  const [returnLoading, setReturnLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleReturnToStock = async () => {
    if (!selectedOrder) return
    if (!confirm(`ยืนยันการคืนสินค้าทั้งหมดของออเดอร์นี้ (${selectedOrder.customer_name}) กลับเข้าสต็อกคลัง?`)) return
    
    setReturnLoading(true)
    setError(null)
    const result = await returnOrderToStock(selectedOrder.id)
    setReturnLoading(false)
    if (result.error) {
      setError(result.error)
    } else {
      setSuccess(true)
      setTimeout(() => {
        window.location.reload()
      }, 1500)
    }
  }

  const downloadPickingList = () => {
    if (!selectedOrder) return
    const pdf = new jsPDF()
    pdf.text('Picking & Packing List (ใบจัดของ)', 14, 20)
    pdf.setFontSize(10)
    pdf.text(`ลูกค้า: ${selectedOrder.customer_name}`, 14, 28)
    pdf.text(`สถานะ: ${selectedOrder.status}`, 14, 34)
    pdf.text(`วันที่ออเดอร์: ${new Date(selectedOrder.created_at).toLocaleDateString('th-TH')}`, 14, 40)

    pdf.text('SKU', 14, 52)
    pdf.text('Product Name', 55, 52)
    pdf.text('Ordered Qty', 140, 52)
    pdf.text('Check', 170, 52)
    pdf.line(14, 55, 196, 55)

    let y = 64
    selectedOrder.order_items.forEach((item: any) => {
      if (y > 280) {
        pdf.addPage()
        y = 20
      }
      pdf.text(item.product.sku || '', 14, y)
      pdf.text(item.product.name?.substring(0, 25) || '', 55, y)
      pdf.text(String(item.ordered_qty), 145, y)
      pdf.text('[   ]', 172, y)
      pdf.line(14, y + 3, 196, y + 3)
      y += 10
    })

    pdf.save(`picking-list-${selectedOrder.customer_name}.pdf`)
  }

  const handleSelectOrder = (order: any) => {
    setSelectedOrder(order)
    setScannedItems({})
    setError(null)
    setSuccess(false)
  }

  const handleScan = (sku: string) => {
    if (!selectedOrder) return

    // Find if this SKU belongs to the order
    const orderItem = selectedOrder.order_items.find((item: any) => item.product.sku === sku)
    
    if (!orderItem) {
      setError(`ไม่พบสินค้ารหัส ${sku} ในออเดอร์นี้`)
      return
    }

    const currentScanned = scannedItems[orderItem.product_id] || 0
    if (currentScanned >= orderItem.ordered_qty) {
      setError(`สแกนสินค้า ${sku} ครบจำนวนแล้ว`)
      return
    }

    setError(null)
    setScannedItems(prev => ({
      ...prev,
      [orderItem.product_id]: currentScanned + 1
    }))
  }

  const checkIsComplete = () => {
    if (!selectedOrder) return false
    return selectedOrder.order_items.every((item: any) => 
      (scannedItems[item.product_id] || 0) === item.ordered_qty
    )
  }

  const handleConfirm = async () => {
    if (!checkIsComplete() || !selectedOrder) return
    
    setLoading(true)
    setError(null)
    
    const result = await confirmShipping(selectedOrder.id)
    
    setLoading(false)
    if (result.error) {
      setError(result.error)
    } else {
      setSuccess(true)
      setTimeout(() => {
        // Refresh page or clear selection
        window.location.reload()
      }, 1500)
    }
  }

  if (success) {
    return (
      <Card className="p-8 text-center flex flex-col items-center gap-4">
        <div className="w-16 h-16 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-white">แพ็คของสำเร็จ!</h3>
        <p className="text-slate-400">ออเดอร์ถูกเปลี่ยนสถานะเป็นส่งแล้ว</p>
      </Card>
    )
  }

  if (!selectedOrder) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-medium text-white">เลือกออเดอร์ที่ต้องการแพ็ค</h2>
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
                <p className="text-sm text-slate-400 mt-1">
                  ต้องแพ็คทั้งหมด: {order.order_items.reduce((sum: number, item: any) => sum + item.ordered_qty, 0)} ชิ้น
                </p>
              </div>
              <Badge variant="warning">{order.status}</Badge>
            </div>
          </Card>
        ))}
        {orders.length === 0 && (
          <div className="text-center py-10 text-slate-400">ไม่มีออเดอร์ที่รอแพ็ค</div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center gap-2">
        <div>
          <h2 className="text-lg font-medium text-white">
            กำลังแพ็ค: <span className="text-indigo-400">{selectedOrder.customer_name}</span>
          </h2>
          <button onClick={() => setSelectedOrder(null)} className="text-xs text-slate-400 hover:text-white mt-1 block">
            ← กลับไปเลือกออเดอร์
          </button>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button onClick={downloadPickingList} size="sm" variant="secondary" className="min-h-[36px] text-xs">
            พิมพ์ใบจัดของ (PDF)
          </Button>
          <Button 
            onClick={handleReturnToStock} 
            isLoading={returnLoading} 
            size="sm" 
            variant="danger" 
            className="min-h-[36px] text-xs bg-red-500/20 text-red-400 border border-red-500/20 hover:bg-red-500/30"
          >
            คืนสต็อก
          </Button>
        </div>
      </div>

      <Card padding="md" className="space-y-4">
        <label className="block text-sm font-medium text-slate-300">
          สแกนบาร์โค้ดสินค้าทีละชิ้น
        </label>
        <BarcodeInput onScan={handleScan} />
        {error && <p className="text-red-400 text-sm">{error}</p>}
      </Card>

      <div className="space-y-3">
        {selectedOrder.order_items.map((item: any) => {
          const scanned = scannedItems[item.product_id] || 0
          const total = item.ordered_qty
          const isComplete = scanned === total

          return (
            <Card key={item.id} padding="md" className={isComplete ? 'border-green-500/30 bg-green-500/5' : ''}>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-white font-medium">{item.product.name}</p>
                  <p className="text-sm text-slate-400">SKU: {item.product.sku}</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold font-mono flex items-baseline gap-1">
                    <span className={isComplete ? 'text-green-400' : 'text-indigo-400'}>{scanned}</span>
                    <span className="text-sm text-slate-500">/ {total}</span>
                  </div>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      <div className="fixed bottom-[80px] left-0 right-0 p-4 bg-slate-900/90 backdrop-blur-xl border-t border-white/5">
        <Button 
          onClick={handleConfirm} 
          disabled={!checkIsComplete()} 
          isLoading={loading}
          className="w-full h-14 text-lg shadow-lg"
        >
          ยืนยันการจัดส่ง (Confirm Shipping)
        </Button>
      </div>
    </div>
  )
}
