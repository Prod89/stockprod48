'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

async function checkOwnerRole() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'owner') redirect('/dashboard')
  
  return supabase
}

export async function getValuationSummary() {
  const supabase = await checkOwnerRole()
  const { data, error } = await supabase.from('valuation_summary_view').select('*')
  if (error) console.error('Valuation error:', error)
  return data || []
}

export async function getDeadStock() {
  const supabase = await checkOwnerRole()
  const { data, error } = await supabase.from('dead_stock_view').select('*')
  if (error) console.error('Dead stock error:', error)
  return data || []
}

export async function getLowStock() {
  const supabase = await checkOwnerRole()
  const { data, error } = await supabase.from('low_stock_view').select('*')
  if (error) console.error('Low stock error:', error)
  return data || []
}

export async function getAuditLogs(limit = 20) {
  const supabase = await checkOwnerRole()
  const { data, error } = await supabase
    .from('audit_logs')
    .select(`
      *,
      profiles:user_id (full_name)
    `)
    .order('created_at', { ascending: false })
    .limit(limit)
  
  if (error) console.error('Audit logs error:', error)
  return data || []
}

export async function getAllProfiles() {
  const supabase = await checkOwnerRole()
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('full_name')
  
  if (error) {
    console.error('Fetch profiles failed:', error)
    return []
  }
  return data || []
}

export async function toggleUserActive(userId: string, active: boolean) {
  const supabase = await checkOwnerRole()
  const { error } = await supabase
    .from('profiles')
    .update({ is_active: active })
    .eq('id', userId)
  
  if (error) {
    console.error('Toggle user status failed:', error)
    return { error: 'ไม่สามารถเปลี่ยนสถานะพนักงานได้' }
  }
  return { success: true }
}

export async function getSalesAnalytics() {
  const supabase = await checkOwnerRole()
  
  // Daily sales (today)
  const todayStart = new Date()
  todayStart.setHours(0,0,0,0)
  const { data: todayOrders } = await supabase
    .from('order_headers')
    .select('total_amount')
    .eq('status', 'SHIPPED')
    .gte('created_at', todayStart.toISOString())
    
  const dailySales = todayOrders?.reduce((sum, o) => sum + Number(o.total_amount), 0) || 0

  // Monthly sales (this month)
  const monthStart = new Date()
  monthStart.setDate(1)
  monthStart.setHours(0,0,0,0)
  const { data: monthOrders } = await supabase
    .from('order_headers')
    .select('total_amount')
    .eq('status', 'SHIPPED')
    .gte('created_at', monthStart.toISOString())

  const monthlySales = monthOrders?.reduce((sum, o) => sum + Number(o.total_amount), 0) || 0

  // Top 10 Best Sellers
  const { data: topItems } = await supabase
    .from('order_items')
    .select(`
      ordered_qty,
      products (
        sku,
        name
      ),
      order_headers!inner (
        status
      )
    `)
    .eq('order_headers.status', 'SHIPPED')

  const salesMap: Record<string, { name: string, sku: string, qty: number }> = {}
  if (topItems) {
    topItems.forEach((item: any) => {
      const p = item.products as any
      if (!p) return
      if (!salesMap[p.sku]) {
        salesMap[p.sku] = { name: p.name, sku: p.sku, qty: 0 }
      }
      salesMap[p.sku].qty += item.ordered_qty
    })
  }

  const top10 = Object.values(salesMap)
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 10)

  return {
    dailySales,
    monthlySales,
    top10
  }
}

export async function getCostSummary() {
  const supabase = await checkOwnerRole()
  const { data, error } = await supabase
    .from('cost_summary_view')
    .select('*')
    .order('lot_date')
  
  if (error) {
    console.error('Fetch cost summary failed:', error)
    return []
  }
  return data || []
}

export async function getLotLocationStock() {
  const supabase = await checkOwnerRole()
  const { data, error } = await supabase
    .from('lot_location_stock_view')
    .select('*')
    .order('lot_date')
  
  if (error) {
    console.error('Fetch lot location stock failed:', error)
    return []
  }
  return data || []
}

export async function getTransactionSummary() {
  const supabase = await checkOwnerRole()
  
  const now = new Date()
  const dailyLimit = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
  
  const weeklyLimitDate = new Date()
  weeklyLimitDate.setDate(now.getDate() - 7)
  const weeklyLimit = weeklyLimitDate.toISOString()

  const monthlyLimitDate = new Date()
  monthlyLimitDate.setMonth(now.getMonth() - 1)
  const monthlyLimit = monthlyLimitDate.toISOString()

  const { data: ledger } = await supabase
    .from('stock_ledger')
    .select('transaction_type, quantity, created_at')
  
  const stats = {
    daily: { in: 0, out: 0 },
    weekly: { in: 0, out: 0 },
    monthly: { in: 0, out: 0 }
  }

  if (ledger) {
    ledger.forEach((item: any) => {
      const qty = item.quantity
      const type = item.transaction_type
      const createdAt = item.created_at

      if (createdAt >= dailyLimit) {
        if (type === 'IN') stats.daily.in += qty
        if (type === 'OUT') stats.daily.out += qty
      }
      if (createdAt >= weeklyLimit) {
        if (type === 'IN') stats.weekly.in += qty
        if (type === 'OUT') stats.weekly.out += qty
      }
      if (createdAt >= monthlyLimit) {
        if (type === 'IN') stats.monthly.in += qty
        if (type === 'OUT') stats.monthly.out += qty
      }
    })
  }

  return stats
}

export async function getLotProfitability() {
  const supabase = await checkOwnerRole()
  const { data, error } = await supabase
    .from('lot_profitability_view')
    .select('*')
    .order('lot_date', { ascending: false })

  if (error) {
    console.error('Lot profitability error:', error)
    return []
  }
  return data || []
}

export async function getAgingAnalysis() {
  const supabase = await checkOwnerRole()
  const { data, error } = await supabase
    .from('aging_analysis_view')
    .select('*')
    .order('days_in_stock', { ascending: false })

  if (error) {
    console.error('Aging analysis error:', error)
    return []
  }
  return data || []
}

export async function getBaleHistory() {
  const supabase = await checkOwnerRole()
  const { data, error } = await supabase
    .from('bale_cost_log')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Bale history error:', error)
    return []
  }
  return data || []
}

export async function saveBaleCost(formData: {
  lot_date: string
  bale_cost: number
  shipping_cost: number
  misc_cost: number
  total_units: number
  notes: string
}) {
  const supabase = await checkOwnerRole()
  const { data: { user } } = await supabase.auth.getUser()

  const { error } = await supabase
    .from('bale_cost_log')
    .insert({
      lot_date: formData.lot_date,
      bale_cost: formData.bale_cost,
      shipping_cost: formData.shipping_cost,
      misc_cost: formData.misc_cost,
      total_units: formData.total_units,
      notes: formData.notes,
      user_id: user?.id
    })

  if (error) {
    console.error('Save bale cost error:', error)
    return { error: 'ไม่สามารถบันทึกต้นทุนกระสอบได้: ' + error.message }
  }
  return { success: true }
}

export async function getStockToCash() {
  const supabase = await checkOwnerRole()

  const { data: ledger } = await supabase
    .from('stock_ledger')
    .select('transaction_type, quantity, created_at')

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastMonthEnd = new Date(monthStart.getTime() - 1)

  let openingStock = 0
  let periodIn = 0
  let periodOut = 0
  let periodAdjust = 0

  if (ledger) {
    ledger.forEach((item: any) => {
      const createdAt = new Date(item.created_at)
      const qty = item.quantity
      const type = item.transaction_type

      if (createdAt <= lastMonthEnd) {
        // Opening balance = all transactions before this month
        if (type === 'IN' || type === 'ADJUST') openingStock += qty
        if (type === 'OUT' || type === 'MOVE') openingStock -= qty
      } else {
        // Current period movements
        if (type === 'IN') periodIn += qty
        if (type === 'OUT') periodOut += qty
        if (type === 'ADJUST') periodAdjust += qty
      }
    })
  }

  const closingStock = openingStock + periodIn - periodOut + periodAdjust
  const expectedClosing = openingStock + periodIn - periodOut
  const variance = closingStock - expectedClosing // difference from ADJUST

  return {
    openingStock,
    periodIn,
    periodOut,
    periodAdjust,
    closingStock,
    expectedClosing,
    variance
  }
}

export async function getInventoryByLocation() {
  const supabase = await checkOwnerRole()
  const { data, error } = await supabase
    .from('inventory_by_location_view')
    .select('*')
    .order('zone_name', { ascending: true })

  if (error) {
    console.error('Inventory location error:', error)
    return []
  }
  return data || []
}

export async function getActiveLocations() {
  const supabase = await checkOwnerRole()
  const { data, error } = await supabase
    .from('locations')
    .select('id, zone_name, status_state, description, barcode_ref')
    .order('zone_name', { ascending: true })

  if (error) {
    console.error('Locations fetch error:', error)
    return []
  }
  return data || []
}

export async function transferStockLocation(
  productId: string,
  fromLocationId: string,
  toLocationId: string,
  qty: number,
  reason: string
) {
  const supabase = await checkOwnerRole()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase.rpc('transfer_stock_location', {
    p_product_id: productId,
    p_from_location_id: fromLocationId,
    p_to_location_id: toLocationId,
    p_qty: qty,
    p_reason: reason,
    p_user_id: user.id
  })

  if (error) {
    console.error('Transfer stock error:', error)
    return { error: 'ไม่สามารถย้ายสต็อกได้: ' + error.message }
  }
  return { success: true }
}

export async function updateEntityDetails(
  entityType: 'PRODUCT' | 'LOCATION',
  entityId: string,
  name: string,
  details: string
) {
  const supabase = await checkOwnerRole()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase.rpc('update_entity_details', {
    p_entity_type: entityType,
    p_entity_id: entityId,
    p_name: name,
    p_details: details,
    p_user_id: user.id
  })

  if (error) {
    console.error('Update entity error:', error)
    return { error: 'แก้ไขข้อมูลไม่สำเร็จ: ' + error.message }
  }
  return { success: true }
}
