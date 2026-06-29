'use client'

import { useState, useTransition } from 'react'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { transferStockLocation, updateEntityDetails } from '@/actions/owner'

interface InventoryLocationManagerProps {
  inventory: any[]
  locations: any[]
}

export function InventoryLocationManager({ inventory, locations }: InventoryLocationManagerProps) {
  const [search, setSearch] = useState('')
  const [isPending, startTransition] = useTransition()
  
  // Edit Location state
  const [editingItem, setEditingItem] = useState<any | null>(null)
  const [transferQty, setTransferQty] = useState('')
  const [toLocation, setToLocation] = useState('')
  
  // Edit Details state
  const [editingDetails, setEditingDetails] = useState<{type: 'PRODUCT'|'LOCATION', id: string, name: string, details: string} | null>(null)

  const [message, setMessage] = useState<{type: 'success'|'error', text: string} | null>(null)

  const exportCsv = () => {
    if (inventory.length === 0) return
    const headers = ['SKU', 'Product', 'Lot', 'Location', 'Status', 'Qty', 'Cost Price']
    const rows = inventory.map(item => [
      item.sku,
      `"${item.name}"`,
      item.lot_date || '',
      `"${item.zone_name}"`,
      item.status_state,
      item.physical_qty,
      item.cost_price || 0
    ].join(','))
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows].join('\n')
    const link = document.createElement('a')
    link.href = encodeURI(csvContent)
    link.download = 'inventory-by-location.csv'
    link.click()
  }

  const handleTransfer = () => {
    if (!editingItem || !toLocation || !transferQty) return
    const qty = parseInt(transferQty)
    if (qty <= 0 || qty > editingItem.physical_qty) {
      setMessage({ type: 'error', text: 'จำนวนไม่ถูกต้อง' })
      return
    }

    startTransition(async () => {
      const result = await transferStockLocation(
        editingItem.product_id,
        editingItem.location_id,
        toLocation,
        qty,
        'OWNER_MANUAL_TRANSFER'
      )
      if (result.error) {
        setMessage({ type: 'error', text: result.error })
      } else {
        setMessage({ type: 'success', text: 'ย้ายสต็อกสำเร็จ' })
        setEditingItem(null)
      }
      setTimeout(() => setMessage(null), 3000)
    })
  }

  const handleSaveDetails = () => {
    if (!editingDetails || !editingDetails.name) return
    startTransition(async () => {
      const result = await updateEntityDetails(
        editingDetails.type,
        editingDetails.id,
        editingDetails.name,
        editingDetails.details
      )
      if (result.error) {
        setMessage({ type: 'error', text: result.error })
      } else {
        setMessage({ type: 'success', text: 'แก้ไขข้อมูลสำเร็จ' })
        setEditingDetails(null)
      }
      setTimeout(() => setMessage(null), 3000)
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Available': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
      case 'Reserved': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'Pending_Shipment': return 'bg-amber-500/20 text-amber-400 border-amber-500/30'
      case 'Completed': return 'bg-purple-500/20 text-purple-400 border-purple-500/30'
      case 'Returned': return 'bg-rose-500/20 text-rose-400 border-rose-500/30'
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30'
    }
  }

  const filteredInventory = inventory.filter(item => 
    item.sku.toLowerCase().includes(search.toLowerCase()) || 
    item.name.toLowerCase().includes(search.toLowerCase()) ||
    item.zone_name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <Card padding="md" className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          การติดตามสถานที่และสถานะ
        </h3>
        <Button onClick={exportCsv} size="sm" variant="secondary" className="text-xs">
          Export CSV
        </Button>
      </div>

      {message && (
        <div className={`p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
          {message.text}
        </div>
      )}

      {/* Editing Modal for Location Transfer */}
      {editingItem && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 p-5 rounded-2xl w-full max-w-sm space-y-4 shadow-2xl">
            <h4 className="text-lg font-bold text-white">ย้ายสต็อก</h4>
            <div className="text-sm text-slate-300">
              <p><span className="text-slate-500">SKU:</span> {editingItem.sku}</p>
              <p><span className="text-slate-500">ต้นทาง:</span> {editingItem.zone_name}</p>
              <p><span className="text-slate-500">มีอยู่:</span> {editingItem.physical_qty} ชิ้น</p>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">จำนวนที่ต้องการย้าย</label>
                <input 
                  type="number" min="1" max={editingItem.physical_qty}
                  value={transferQty} onChange={e => setTransferQty(e.target.value)}
                  className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">ไปยังสถานที่ (To Location)</label>
                <select 
                  value={toLocation} onChange={e => setToLocation(e.target.value)}
                  className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
                >
                  <option value="">-- เลือกสถานที่ --</option>
                  {locations.filter(l => l.id !== editingItem.location_id).map(loc => (
                    <option key={loc.id} value={loc.id}>{loc.zone_name} (Status: {loc.status_state})</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="flex gap-2 pt-2">
              <Button onClick={() => setEditingItem(null)} variant="secondary" className="flex-1">ยกเลิก</Button>
              <Button onClick={handleTransfer} disabled={isPending || !toLocation || !transferQty} className="flex-1">
                {isPending ? 'กำลังย้าย...' : 'ยืนยันย้าย'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Editing Modal for Product/Location Details */}
      {editingDetails && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 p-5 rounded-2xl w-full max-w-sm space-y-4 shadow-2xl">
            <h4 className="text-lg font-bold text-white">แก้ไขข้อมูล {editingDetails.type === 'PRODUCT' ? 'สินค้า' : 'สถานที่'}</h4>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">ชื่อ</label>
                <input 
                  type="text"
                  value={editingDetails.name} onChange={e => setEditingDetails({...editingDetails, name: e.target.value})}
                  className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">รายละเอียด / หมวดหมู่</label>
                <input 
                  type="text"
                  value={editingDetails.details} onChange={e => setEditingDetails({...editingDetails, details: e.target.value})}
                  className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
                />
              </div>
            </div>
            
            <div className="flex gap-2 pt-2">
              <Button onClick={() => setEditingDetails(null)} variant="secondary" className="flex-1">ยกเลิก</Button>
              <Button onClick={handleSaveDetails} disabled={isPending || !editingDetails.name} className="flex-1">
                {isPending ? 'กำลังบันทึก...' : 'บันทึก'}
              </Button>
            </div>
          </div>
        </div>
      )}

      <input
        type="text"
        placeholder="🔍 ค้นหา SKU, ชื่อสินค้า, หรือ Zone..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
      />

      <p className="text-xs text-slate-500">แสดง {filteredInventory.length} รายการ</p>

      {/* Mobile Card Layout for Inventory */}
      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
        {filteredInventory.map((item, idx) => (
          <div key={`${item.product_id}-${item.location_id}-${idx}`} className="bg-white/[0.03] border border-white/5 rounded-2xl p-4 space-y-3">
            <div className="flex justify-between items-start gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-mono text-indigo-300 font-bold">{item.sku}</p>
                  <button 
                    onClick={() => setEditingDetails({ type: 'PRODUCT', id: item.product_id, name: item.name, details: '' })}
                    className="text-slate-500 hover:text-indigo-400" title="แก้ไขชื่อสินค้า"
                  >
                    ✎
                  </button>
                </div>
                <p className="text-white text-sm truncate" title={item.name}>{item.name}</p>
              </div>
              <div className="text-right flex-shrink-0 bg-slate-950 p-2 rounded-xl border border-white/5">
                <p className="text-[10px] text-slate-500 mb-0.5">จำนวนชิ้น</p>
                <p className="text-base font-bold text-emerald-400 font-mono">{item.physical_qty}</p>
              </div>
            </div>

            <div className="flex items-center justify-between bg-slate-900/50 p-2.5 rounded-xl border border-white/5">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">พิกัด:</span>
                <span className="font-bold text-slate-200 text-sm">{item.zone_name}</span>
                {item.location_id && (
                  <button 
                    onClick={() => setEditingDetails({ type: 'LOCATION', id: item.location_id, name: item.zone_name, details: '' })}
                    className="text-slate-500 hover:text-indigo-400" title="แก้ไขชื่อสถานที่"
                  >
                    ✎
                  </button>
                )}
              </div>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusColor(item.status_state)}`}>
                {item.status_state}
              </span>
            </div>

            <Button 
              onClick={() => {
                setEditingItem(item)
                setTransferQty(item.physical_qty.toString())
                setToLocation('')
              }} 
              variant="secondary" className="w-full min-h-[40px] text-xs"
            >
              📦 ย้ายสต็อก (Move)
            </Button>
          </div>
        ))}
        {filteredInventory.length === 0 && (
          <p className="text-center py-6 text-slate-500 text-sm">ไม่พบข้อมูลสินค้า</p>
        )}
      </div>
    </Card>
  )
}
