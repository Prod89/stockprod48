'use client'

import { useState, useMemo, useTransition } from 'react'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { Badge } from '../ui/Badge'
import type { InventoryDetailItem } from '@/actions/inventory'
import { bulkMoveStock, updateProductDetails } from '@/actions/inventory'
import { updateEntityDetails } from '@/actions/owner'
import { format } from 'date-fns'
import { th } from 'date-fns/locale'

interface InventoryTableProps {
  initialData: InventoryDetailItem[]
  locations: { id: string; zone_name: string }[]
}

type SortField = 'sku' | 'name' | 'zone_name' | 'quantity' | 'cost_price' | 'total_value' | 'stock_age_days'
type SortOrder = 'asc' | 'desc'

export function InventoryTable({ initialData, locations }: InventoryTableProps) {
  const [data, setData] = useState<InventoryDetailItem[]>(initialData)
  const [search, setSearch] = useState('')
  const [filterLocation, setFilterLocation] = useState('')
  const [filterAge, setFilterAge] = useState('')
  const [sortField, setSortField] = useState<SortField>('sku')
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')
  
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isBulkMoveOpen, setIsBulkMoveOpen] = useState(false)
  const [targetLocation, setTargetLocation] = useState('')
  const [moveReason, setMoveReason] = useState('จัดระเบียบสต็อก')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [editingLocation, setEditingLocation] = useState<{ id: string, name: string } | null>(null)
  const [editingProduct, setEditingProduct] = useState<{
    product_id: string
    sku: string
    name: string
    cost_price: number
    grade: string
  } | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const processedData = useMemo(() => {
    let result = [...data]
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(item => 
        item.sku.toLowerCase().includes(q) || 
        item.name.toLowerCase().includes(q) || 
        item.zone_name.toLowerCase().includes(q)
      )
    }
    if (filterLocation) {
      result = result.filter(item => item.location_id === filterLocation)
    }
    if (filterAge) {
      const days = parseInt(filterAge)
      if (!isNaN(days)) {
        result = result.filter(item => item.stock_age_days >= days)
      }
    }
    result.sort((a, b) => {
      let aVal = a[sortField]
      let bVal = b[sortField]
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
      }
      return sortOrder === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number)
    })
    return result
  }, [data, search, filterLocation, filterAge, sortField, sortOrder])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
  }

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedIds(next)
  }

  const exportCsv = () => {
    const headers = ['SKU', 'Name', 'Location', 'Quantity', 'Cost Price', 'Total Value', 'Stock Age (Days)']
    const rows = processedData.map(item => [
      item.sku,
      `"${item.name}"`,
      item.zone_name,
      item.quantity,
      item.cost_price,
      item.total_value,
      item.stock_age_days
    ].join(','))
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows].join('\n')
    const link = document.createElement('a')
    link.href = encodeURI(csvContent)
    link.download = `inventory-audit-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  const handleBulkMove = () => {
    if (selectedIds.size === 0 || !targetLocation) return
    setError(null)
    startTransition(async () => {
      const itemsToMove = processedData
        .filter(item => selectedIds.has(item.id))
        .map(item => ({
          product_id: item.product_id,
          from_location_id: item.location_id,
          qty: item.quantity
        }))
      const result = await bulkMoveStock(itemsToMove, targetLocation, moveReason)
      if (result.error) {
        setError(result.error)
      } else {
        setData(prev => prev.map(item => {
          if (selectedIds.has(item.id)) {
            const newLoc = locations.find(l => l.id === targetLocation)
            return { ...item, location_id: targetLocation, zone_name: newLoc?.zone_name || item.zone_name }
          }
          return item
        }))
        setSelectedIds(new Set())
        setIsBulkMoveOpen(false)
      }
    })
  }

  const handleSaveLocation = () => {
    if (!editingLocation || !editingLocation.name) return
    startTransition(async () => {
      const result = await updateEntityDetails('LOCATION', editingLocation.id, editingLocation.name, '')
      if (result.error) {
        setMessage({ type: 'error', text: result.error })
      } else {
        setMessage({ type: 'success', text: 'แก้ไขชื่อสถานที่สำเร็จ' })
        setData(prev => prev.map(item => 
          item.location_id === editingLocation.id ? { ...item, zone_name: editingLocation.name } : item
        ))
        setEditingLocation(null)
      }
      setTimeout(() => setMessage(null), 3000)
    })
  }

  const handleSaveProduct = () => {
    if (!editingProduct) return
    startTransition(async () => {
      const result = await updateProductDetails(editingProduct.product_id, {
        name: editingProduct.name,
        cost_price: editingProduct.cost_price,
        grade: editingProduct.grade,
      })
      if (result.error) {
        setMessage({ type: 'error', text: result.error })
      } else {
        setMessage({ type: 'success', text: `แก้ไขสินค้า ${editingProduct.sku} สำเร็จ` })
        setData(prev => prev.map(item => {
          if (item.product_id === editingProduct.product_id) {
            const newCost = editingProduct.cost_price
            return { ...item, name: editingProduct.name, cost_price: newCost, total_value: newCost * item.quantity }
          }
          return item
        }))
        setEditingProduct(null)
      }
      setTimeout(() => setMessage(null), 3000)
    })
  }

  const gradeOptions = [
    { value: 'Premium', label: 'Premium' },
    { value: '1', label: 'เกรด 1' },
    { value: '2', label: 'เกรด 2' },
    { value: '3', label: 'เกรด 3' },
  ]

  const sortOptions = [
    { value: 'sku', label: 'SKU' },
    { value: 'name', label: 'ชื่อสินค้า' },
    { value: 'quantity', label: 'จำนวน' },
    { value: 'cost_price', label: 'ต้นทุน' },
    { value: 'total_value', label: 'มูลค่ารวม' },
    { value: 'stock_age_days', label: 'อายุสต็อก' },
  ]

  return (
    <div className="space-y-4">
      {/* Search & Filters — stacked on mobile */}
      <div className="space-y-3">
        <Input 
          placeholder="🔍 ค้นหา SKU, ชื่อ, หรือตำแหน่ง..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full"
        />
        <div className="grid grid-cols-2 gap-2">
          <Select
            value={filterLocation}
            onChange={(e) => setFilterLocation(e.target.value)}
            options={locations.map(l => ({ value: l.id, label: l.zone_name }))}
            placeholder="ทุกตำแหน่ง"
          />
          <Select
            value={filterAge}
            onChange={(e) => setFilterAge(e.target.value)}
            options={[
              { value: '30', label: 'เก่ากว่า 30 วัน' },
              { value: '60', label: 'เก่ากว่า 60 วัน' },
              { value: '90', label: 'เก่ากว่า 90 วัน' },
            ]}
            placeholder="อายุสต็อกทั้งหมด"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Select
            value={sortField}
            onChange={(e) => handleSort(e.target.value as SortField)}
            options={sortOptions}
            placeholder="เรียงตาม"
          />
          <div className="flex gap-2">
            <Button 
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')} 
              variant="secondary" 
              className="flex-1 text-xs"
            >
              {sortOrder === 'asc' ? '↑ น้อย→มาก' : '↓ มาก→น้อย'}
            </Button>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button 
          onClick={() => setIsBulkMoveOpen(!isBulkMoveOpen)} 
          variant="secondary" 
          disabled={selectedIds.size === 0}
          className="flex-1 text-xs"
          size="sm"
        >
          📦 ย้ายสต็อก ({selectedIds.size})
        </Button>
        <Button onClick={exportCsv} variant="primary" className="flex-1 text-xs" size="sm">
          📄 Export CSV
        </Button>
      </div>

      {/* Toast Message */}
      {message && (
        <div className={`p-3 rounded-xl text-sm font-medium ${message.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
          {message.text}
        </div>
      )}

      {/* Bulk Move Panel */}
      {isBulkMoveOpen && (
        <Card padding="md" className="bg-indigo-900/20 border-indigo-500/30 space-y-3">
          <Select
            label="ย้ายไปยังตำแหน่งใหม่"
            value={targetLocation}
            onChange={(e) => setTargetLocation(e.target.value)}
            options={locations.map(l => ({ value: l.id, label: l.zone_name }))}
            placeholder="เลือกตำแหน่ง..."
          />
          <Input
            label="เหตุผลการย้าย"
            value={moveReason}
            onChange={(e) => setMoveReason(e.target.value)}
          />
          <Button onClick={handleBulkMove} isLoading={isPending} disabled={!targetLocation} className="w-full">
            ยืนยันการย้าย
          </Button>
          {error && <p className="text-red-400 text-sm">{error}</p>}
        </Card>
      )}

      {/* Location Edit Modal */}
      {editingLocation && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-slate-900 border-t sm:border border-white/10 p-5 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-sm space-y-4 shadow-2xl">
            <h4 className="text-lg font-bold text-white">แก้ไขชื่อสถานที่</h4>
            <div>
              <label className="text-xs text-slate-400 block mb-1.5">ชื่อสถานที่</label>
              <input 
                type="text"
                value={editingLocation.name} 
                onChange={e => setEditingLocation({...editingLocation, name: e.target.value})}
                className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white text-base focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <Button onClick={() => setEditingLocation(null)} variant="secondary" className="flex-1 min-h-[48px]">ยกเลิก</Button>
              <Button onClick={handleSaveLocation} disabled={isPending || !editingLocation.name} className="flex-1 min-h-[48px]">
                {isPending ? 'กำลังบันทึก...' : 'บันทึก'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Product Edit Modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-slate-900 border-t sm:border border-white/10 p-5 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md space-y-5 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-bold text-white">แก้ไขรายละเอียดสินค้า</h4>
              <span className="font-mono text-xs text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded-lg">{editingProduct.sku}</span>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">ชื่อสินค้า</label>
                <input 
                  type="text"
                  value={editingProduct.name}
                  onChange={e => setEditingProduct({...editingProduct, name: e.target.value})}
                  className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white text-base focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1.5">ต้นทุน/ชิ้น</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">฿</span>
                    <input 
                      type="number"
                      step="0.01"
                      min="0"
                      value={editingProduct.cost_price}
                      onChange={e => setEditingProduct({...editingProduct, cost_price: parseFloat(e.target.value) || 0})}
                      className="w-full bg-slate-800 border border-white/10 rounded-xl pl-8 pr-4 py-3 text-white text-base font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1.5">เกรดสินค้า</label>
                  <select
                    value={editingProduct.grade}
                    onChange={e => setEditingProduct({...editingProduct, grade: e.target.value})}
                    className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white text-base focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none"
                  >
                    {gradeOptions.map(opt => (
                      <option key={opt.value} value={opt.value} className="bg-slate-900">{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            
            <div className="flex gap-2 pt-1">
              <Button onClick={() => setEditingProduct(null)} variant="secondary" className="flex-1 min-h-[48px]">ยกเลิก</Button>
              <Button onClick={handleSaveProduct} disabled={isPending || !editingProduct.name} className="flex-1 min-h-[48px]">
                {isPending ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Result count */}
      <p className="text-xs text-slate-500">แสดง {processedData.length} รายการ</p>

      {/* Mobile Card Layout */}
      <div className="space-y-3">
        {processedData.map((item) => {
          const isSelected = selectedIds.has(item.id)
          return (
            <div 
              key={item.id} 
              className={`bg-white/[0.03] border rounded-2xl overflow-hidden transition-all active:scale-[0.99] ${
                isSelected ? 'border-indigo-500/40 bg-indigo-500/5' : 'border-white/5'
              }`}
            >
              {/* Top row: checkbox + SKU + edit button */}
              <div className="flex items-center gap-3 px-4 pt-3 pb-2">
                <input 
                  type="checkbox" 
                  className="rounded border-slate-600 bg-slate-800 focus:ring-indigo-500 w-5 h-5 flex-shrink-0"
                  checked={isSelected}
                  onChange={() => toggleSelect(item.id)}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-indigo-300 font-bold text-sm">{item.sku}</p>
                  <p className="text-xs text-slate-400 truncate">{item.name}</p>
                </div>
                <button
                  onClick={() => setEditingProduct({
                    product_id: item.product_id,
                    sku: item.sku,
                    name: item.name,
                    cost_price: item.cost_price,
                    grade: 'Premium',
                  })}
                  className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-indigo-400 bg-white/5 hover:bg-indigo-500/10 border border-white/10 hover:border-indigo-500/30 px-3 py-2 rounded-xl transition-all active:scale-95 flex-shrink-0"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  แก้ไข
                </button>
              </div>

              {/* Data grid */}
              <div className="grid grid-cols-3 gap-px bg-white/5 mx-3 mb-3 rounded-xl overflow-hidden">
                <div className="bg-slate-950 p-2.5 text-center">
                  <p className="text-[10px] text-slate-500 mb-0.5">จำนวน</p>
                  <p className="text-base font-bold text-emerald-400 font-mono">{item.quantity}</p>
                </div>
                <div className="bg-slate-950 p-2.5 text-center">
                  <p className="text-[10px] text-slate-500 mb-0.5">ต้นทุน/ชิ้น</p>
                  <p className="text-sm font-medium text-slate-300 font-mono">฿{item.cost_price.toLocaleString()}</p>
                </div>
                <div className="bg-slate-950 p-2.5 text-center">
                  <p className="text-[10px] text-slate-500 mb-0.5">มูลค่ารวม</p>
                  <p className="text-sm font-bold text-indigo-400 font-mono">฿{item.total_value.toLocaleString()}</p>
                </div>
              </div>

              {/* Bottom row: location + age */}
              <div className="flex items-center justify-between px-4 pb-3 gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <Badge variant="default">{item.zone_name}</Badge>
                  <button 
                    onClick={() => setEditingLocation({ id: item.location_id, name: item.zone_name })}
                    className="text-slate-500 hover:text-indigo-400 p-1.5 transition-colors flex-shrink-0"
                    title="แก้ไขชื่อสถานที่"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge variant={item.stock_age_days > 90 ? 'error' : item.stock_age_days > 30 ? 'warning' : 'success'}>
                    {item.stock_age_days} วัน
                  </Badge>
                  {item.first_in_date && (
                    <span className="text-[10px] text-slate-500 whitespace-nowrap">
                      {format(new Date(item.first_in_date), 'd MMM yy', { locale: th })}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )
        })}

        {processedData.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-slate-400 text-sm">ไม่พบข้อมูลสินค้า</p>
            <p className="text-slate-500 text-xs mt-1">ลองเปลี่ยนคำค้นหาหรือตัวกรอง</p>
          </div>
        )}
      </div>
    </div>
  )
}
