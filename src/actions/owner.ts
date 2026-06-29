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
