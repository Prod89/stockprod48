'use client'

import { useState, useMemo, useTransition } from 'react'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { Badge } from '../ui/Badge'
import type { InventoryDetailItem } from '@/actions/inventory'
import { bulkMoveStock } from '@/actions/inventory'

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
                    <Badge variant="default">{item.zone_name}</Badge>
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
                    <Badge variant={item.stock_age_days > 90 ? 'error' : item.stock_age_days > 30 ? 'warning' : 'success'}>
                      {item.stock_age_days} วัน
                    </Badge>
                  </td>
                </tr>
              ))}
              {processedData.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
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
