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

  // Memoized filtered and sorted data
  const processedData = useMemo(() => {
    let result = [...data]

    // Search filter
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(item => 
        item.sku.toLowerCase().includes(q) || 
        item.name.toLowerCase().includes(q) || 
        item.zone_name.toLowerCase().includes(q)
      )
    }

    // Location filter
    if (filterLocation) {
      result = result.filter(item => item.location_id === filterLocation)
    }

    // Age filter
    if (filterAge) {
      const days = parseInt(filterAge)
      if (!isNaN(days)) {
        result = result.filter(item => item.stock_age_days >= days)
      }
    }

    // Sort
    result.sort((a, b) => {
      let aVal = a[sortField]
      let bVal = b[sortField]
      
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
      }
      
      // Numbers
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

  const toggleSelectAll = () => {
    if (selectedIds.size === processedData.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(processedData.map(i => i.id)))
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
        // Optimistic update
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
      const result = await updateEntityDetails(
        'LOCATION',
        editingLocation.id,
        editingLocation.name,
        ''
      )
      if (result.error) {
        setMessage({ type: 'error', text: result.error })
      } else {
        setMessage({ type: 'success', text: 'แก้ไขชื่อสถานที่สำเร็จ' })
        // Optimistic update
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
        // Optimistic update
        setData(prev => prev.map(item => {
          if (item.product_id === editingProduct.product_id) {
            const newCost = editingProduct.cost_price
            return {
              ...item,
              name: editingProduct.name,
              cost_price: newCost,
              total_value: newCost * item.quantity,
            }
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

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Input 
            placeholder="ค้นหา SKU, ชื่อสินค้า, หรือตำแหน่ง..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-64"
          />
          <Select
            value={filterLocation}
            onChange={(e) => setFilterLocation(e.target.value)}
            options={locations.map(l => ({ value: l.id, label: l.zone_name }))}
            placeholder="ทุกตำแหน่ง"
            className="w-full sm:w-40"
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
            className="w-full sm:w-40"
          />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button onClick={() => setIsBulkMoveOpen(!isBulkMoveOpen)} variant="secondary" disabled={selectedIds.size === 0}>
            ย้ายสต็อก ({selectedIds.size})
          </Button>
          <Button onClick={exportCsv} variant="primary">
            Export CSV
          </Button>
        </div>
      </div>

      {message && (
        <div className={`p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
          {message.text}
        </div>
      )}

      {/* Bulk Move Panel */}
      {isBulkMoveOpen && (
        <Card padding="md" className="bg-indigo-900/20 border-indigo-500/30">
          <div className="flex flex-col sm:flex-row items-end gap-4">
            <div className="flex-1 w-full">
              <Select
                label="ย้ายไปยังตำแหน่งใหม่"
                value={targetLocation}
                onChange={(e) => setTargetLocation(e.target.value)}
                options={locations.map(l => ({ value: l.id, label: l.zone_name }))}
                placeholder="เลือกตำแหน่ง..."
              />
            </div>
            <div className="flex-1 w-full">
              <Input
                label="เหตุผลการย้าย"
                value={moveReason}
                onChange={(e) => setMoveReason(e.target.value)}
              />
            </div>
            <Button onClick={handleBulkMove} isLoading={isPending} disabled={!targetLocation} className="w-full sm:w-auto mt-4 sm:mt-0">
              ยืนยันการย้าย
            </Button>
          </div>
          {error && <p className="text-red-400 mt-2 text-sm">{error}</p>}
        </Card>
      )}

      {/* Editing Modal for Location Details */}
      {editingLocation && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 p-5 rounded-2xl w-full max-w-sm space-y-4 shadow-2xl">
            <h4 className="text-lg font-bold text-white">แก้ไขชื่อสถานที่ (Location)</h4>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">ชื่อสถานที่</label>
                <input 
                  type="text"
                  value={editingLocation.name} onChange={e => setEditingLocation({...editingLocation, name: e.target.value})}
                  className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
            
            <div className="flex gap-2 pt-2">
              <Button onClick={() => setEditingLocation(null)} variant="secondary" className="flex-1">ยกเลิก</Button>
              <Button onClick={handleSaveLocation} disabled={isPending || !editingLocation.name} className="flex-1">
                {isPending ? 'กำลังบันทึก...' : 'บันทึก'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Editing Modal for Product Details */}
      {editingProduct && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 p-5 rounded-2xl w-full max-w-md space-y-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-bold text-white">แก้ไขรายละเอียดสินค้า</h4>
              <span className="font-mono text-xs text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded-lg">{editingProduct.sku}</span>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">ชื่อสินค้า (Product Name)</label>
                <input 
                  type="text"
                  value={editingProduct.name}
                  onChange={e => setEditingProduct({...editingProduct, name: e.target.value})}
                  className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1.5">ต้นทุน/ชิ้น (Cost Price)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">฿</span>
                    <input 
                      type="number"
                      step="0.01"
                      min="0"
                      value={editingProduct.cost_price}
                      onChange={e => setEditingProduct({...editingProduct, cost_price: parseFloat(e.target.value) || 0})}
                      className="w-full bg-slate-800 border border-white/10 rounded-xl pl-8 pr-4 py-3 text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1.5">เกรดสินค้า (Grade)</label>
                  <select
                    value={editingProduct.grade}
                    onChange={e => setEditingProduct({...editingProduct, grade: e.target.value})}
                    className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all appearance-none"
                  >
                    {gradeOptions.map(opt => (
                      <option key={opt.value} value={opt.value} className="bg-slate-900">{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            
            <div className="flex gap-2 pt-2">
              <Button onClick={() => setEditingProduct(null)} variant="secondary" className="flex-1">ยกเลิก</Button>
              <Button onClick={handleSaveProduct} disabled={isPending || !editingProduct.name} className="flex-1">
                {isPending ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <Card padding="none" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-white/5 border-b border-white/10 text-slate-300">
              <tr>
                <th className="p-4 w-12 text-center">
                  <input 
                    type="checkbox" 
                    className="rounded border-slate-600 bg-slate-800 focus:ring-indigo-500"
                    checked={processedData.length > 0 && selectedIds.size === processedData.length}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th className="p-4 font-medium cursor-pointer hover:text-white" onClick={() => handleSort('sku')}>
                  SKU / Name {sortField === 'sku' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th className="p-4 font-medium cursor-pointer hover:text-white" onClick={() => handleSort('zone_name')}>
                  Location {sortField === 'zone_name' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th className="p-4 font-medium text-right cursor-pointer hover:text-white" onClick={() => handleSort('quantity')}>
                  Qty {sortField === 'quantity' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th className="p-4 font-medium text-right cursor-pointer hover:text-white" onClick={() => handleSort('cost_price')}>
                  Cost/Unit {sortField === 'cost_price' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th className="p-4 font-medium text-right cursor-pointer hover:text-white text-indigo-300" onClick={() => handleSort('total_value')}>
                  Total Value {sortField === 'total_value' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th className="p-4 font-medium text-center cursor-pointer hover:text-white" onClick={() => handleSort('stock_age_days')}>
                  Age (Days) {sortField === 'stock_age_days' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th className="p-4 font-medium text-center w-16">
                  จัดการ
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {processedData.map((item) => (
                <tr 
                  key={item.id} 
                  className={`hover:bg-white/[0.02] transition-colors ${selectedIds.has(item.id) ? 'bg-indigo-500/10' : ''}`}
                >
                  <td className="p-4 text-center">
                    <input 
                      type="checkbox" 
                      className="rounded border-slate-600 bg-slate-800 focus:ring-indigo-500"
                      checked={selectedIds.has(item.id)}
                      onChange={() => toggleSelect(item.id)}
                    />
                  </td>
                  <td className="p-4">
                    <p className="font-mono text-indigo-300 font-bold">{item.sku}</p>
                    <p className="text-xs text-slate-400 max-w-[200px] truncate" title={item.name}>{item.name}</p>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Badge variant="default">{item.zone_name}</Badge>
                      <button 
                        onClick={() => setEditingLocation({ id: item.location_id, name: item.zone_name })}
                        className="text-slate-500 hover:text-indigo-400 p-1 transition-colors" title="แก้ไขชื่อสถานที่"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                    </div>
                  </td>
                  <td className="p-4 text-right font-mono text-emerald-400 font-medium">
                    {item.quantity}
                  </td>
                  <td className="p-4 text-right font-mono text-slate-300">
                    ฿{item.cost_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="p-4 text-right font-mono font-bold text-indigo-400">
                    ฿{item.total_value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex flex-col items-center">
                      <Badge variant={item.stock_age_days > 90 ? 'error' : item.stock_age_days > 30 ? 'warning' : 'success'}>
                        {item.stock_age_days} วัน
                      </Badge>
                      {item.first_in_date && (
                        <span className="text-[10px] text-slate-500 mt-1 whitespace-nowrap">
                          รับเข้า: {format(new Date(item.first_in_date), 'd MMM yyyy', { locale: th })}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <button
                      onClick={() => setEditingProduct({
                        product_id: item.product_id,
                        sku: item.sku,
                        name: item.name,
                        cost_price: item.cost_price,
                        grade: 'Premium', // default, will be from data if available
                      })}
                      className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-indigo-400 bg-white/5 hover:bg-indigo-500/10 border border-white/10 hover:border-indigo-500/30 px-2.5 py-1.5 rounded-lg transition-all"
                      title="แก้ไขรายละเอียดสินค้า"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      แก้ไข
                    </button>
                  </td>
                </tr>
              ))}
              {processedData.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    ไม่พบข้อมูลสินค้า
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
