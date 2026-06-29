'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getAvailableStock(productId?: string) {
  const supabase = await createClient()
  
  let query = supabase.from('available_stock_view').select('*')
  if (productId) {
    query = query.eq('product_id', productId)
  }

  const { data, error } = await query
  if (error) {
    console.error('Error fetching available stock:', error)
    return []
  }
  return data
}

export async function createOrder(customerName: string, items: { product_id: string, ordered_qty: number, selling_price: number }[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }
  if (items.length === 0) return { error: 'Cart is empty' }

  // Double check stock before saving
  const productIds = items.map(i => i.product_id)
  const { data: stocks } = await supabase.from('available_stock_view').select('product_id, available_qty').in('product_id', productIds)
  
  for (const item of items) {
    const stock = stocks?.find(s => s.product_id === item.product_id)
    if (!stock || stock.available_qty < item.ordered_qty) {
      return { error: `สินค้าบางรายการสต็อกไม่พอ (Available: ${stock?.available_qty || 0})` }
    }
  }

  const totalAmount = items.reduce((sum, item) => sum + (item.ordered_qty * item.selling_price), 0)

  // 1. Create Order Header
  const { data: orderHeader, error: headerError } = await supabase
    .from('order_headers')
    .insert({
      customer_name: customerName,
      total_amount: totalAmount,
      user_id: user.id,
      status: 'PENDING'
    })
    .select()
    .single()

  if (headerError || !orderHeader) {
    return { error: 'Failed to create order header' }
  }

  // 2. Create Order Items
  const orderItemsData = items.map(item => ({
    order_id: orderHeader.id,
    ...item
  }))

  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(orderItemsData)

  if (itemsError) {
    // Ideally we would delete the header here to rollback, but real production would use an RPC for full transaction.
    // We are doing simple sequential inserts since items insert rarely fails if foreign keys are correct.
    await supabase.from('order_headers').delete().eq('id', orderHeader.id)
    return { error: 'Failed to create order items' }
  }

  revalidatePath('/orders')
  revalidatePath('/dashboard')
  
  return { success: true, data: orderHeader }
}

export async function getRecentOrders(status?: string) {
  const supabase = await createClient()
  
  let query = supabase.from('order_headers')
    .select(`
      *,
      profiles:user_id(full_name),
      order_items (
        *,
        product:products (sku, name, grade)
      )
    `)
    .order('created_at', { ascending: false })
    .limit(50)

  if (status) {
    query = query.eq('status', status)
  }

  const { data, error } = await query
  if (error) return []
  return data
}
