'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

async function checkOwnerRole() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('401 Unauthorized: Please login')
  }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'owner') {
    throw new Error('403 Forbidden: Owner access required')
  }
  
  return supabase
}

export interface InventoryDetailItem {
  id: string // combination of product_id and location_id
  product_id: string
  sku: string
  name: string
  location_id: string
  zone_name: string
  quantity: number
  cost_price: number
  total_value: number
  stock_age_days: number
  first_in_date: string | null
  image_url: string | null
}

export async function getDetailedInventory(): Promise<InventoryDetailItem[]> {
  const supabase = await checkOwnerRole()

  // 1. Fetch inventory by location
  const { data: invData, error: invError } = await supabase
    .from('inventory_by_location_view')
    .select('*')
  
  if (invError) throw new Error('Failed to fetch inventory: ' + invError.message)
  if (!invData) return []

  // 2. Fetch products for cost_price
  const { data: prodData, error: prodError } = await supabase
    .from('products')
    .select('id, cost_price')
  
  if (prodError) throw new Error('Failed to fetch products: ' + prodError.message)

  const prodMap = new Map<string, number>(prodData?.map(p => [p.id, p.cost_price || 0]))

  // 3. Fetch first IN transaction for stock age
  const { data: ledgerData, error: ledgerError } = await supabase
    .from('stock_ledger')
    .select('product_id, created_at')
    .eq('transaction_type', 'IN')
    .order('created_at', { ascending: true })

  if (ledgerError) throw new Error('Failed to fetch ledger: ' + ledgerError.message)

  const firstInMap = new Map<string, Date>()
  if (ledgerData) {
    for (const entry of ledgerData) {
      if (!firstInMap.has(entry.product_id)) {
        firstInMap.set(entry.product_id, new Date(entry.created_at))
      }
    }
  }

  const now = new Date()
  const result: InventoryDetailItem[] = invData.map((item: any) => {
    const cost_price = prodMap.get(item.product_id) || 0
    const qty = Number(item.physical_qty) || 0
    
    let stock_age_days = 0
    const firstIn = firstInMap.get(item.product_id)
    if (firstIn) {
      const diffTime = Math.abs(now.getTime() - firstIn.getTime())
      stock_age_days = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    }

    return {
      id: `${item.product_id}_${item.location_id}`,
      product_id: item.product_id,
      sku: item.sku,
      name: item.name,
      location_id: item.location_id,
      zone_name: item.zone_name || 'N/A',
      quantity: qty,
      cost_price: cost_price,
      total_value: cost_price * qty,
      stock_age_days,
      first_in_date: firstIn ? firstIn.toISOString() : null,
      image_url: null // Placeholder as products table lacks image_url currently
    }
  }).filter(item => item.quantity > 0)

  return result
}

export async function bulkMoveStock(
  items: { product_id: string; from_location_id: string; qty: number }[],
  toLocationId: string,
  reason: string
) {
  const supabase = await checkOwnerRole()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  // Process moves sequentially or use a bulk RPC if available.
  // Since we don't have a bulk RPC, we'll iterate. For small/medium bulks, this is fine.
  let successCount = 0
  let errorMessages: string[] = []

  for (const item of items) {
    const { error } = await supabase.rpc('transfer_stock_location', {
      p_product_id: item.product_id,
      p_from_location_id: item.from_location_id,
      p_to_location_id: toLocationId,
      p_qty: item.qty,
      p_reason: reason,
      p_user_id: user.id
    })

    if (error) {
      errorMessages.push(`SKU ${item.product_id}: ${error.message}`)
    } else {
      successCount++
    }
  }

  revalidatePath('/owner/inventory')
  revalidatePath('/dashboard')

  if (errorMessages.length > 0) {
    return { 
      error: `Moved ${successCount} items. Failed ${errorMessages.length} items.`, 
      details: errorMessages 
    }
  }

  return { success: true }
}

export async function updateProductDetails(
  productId: string,
  updates: {
    name?: string
    cost_price?: number
    grade?: string
  }
) {
  const supabase = await checkOwnerRole()

  const updatePayload: Record<string, any> = {}
  if (updates.name !== undefined) updatePayload.name = updates.name
  if (updates.cost_price !== undefined) updatePayload.cost_price = updates.cost_price
  if (updates.grade !== undefined) updatePayload.grade = updates.grade
  updatePayload.updated_at = new Date().toISOString()

  const { error } = await supabase
    .from('products')
    .update(updatePayload)
    .eq('id', productId)

  if (error) {
    console.error('Update product error:', error)
    return { error: 'แก้ไขข้อมูลสินค้าไม่สำเร็จ: ' + error.message }
  }

  revalidatePath('/owner/inventory')
  revalidatePath('/dashboard')
  return { success: true }
}
