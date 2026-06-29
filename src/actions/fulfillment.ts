'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function confirmShipping(orderId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  // Call the RPC function
  const { error } = await supabase.rpc('confirm_shipping', {
    p_order_id: orderId,
    p_user_id: user.id
  })

  if (error) {
    console.error('Confirm shipping error:', error)
    return { error: error.message || 'Failed to confirm shipping' }
  }

  revalidatePath('/packing')
  revalidatePath('/orders')
  revalidatePath('/dashboard')
  
  return { success: true }
}

export async function handleReturn(orderId: string, items: { id: string, product_id: string, returned_qty: number }[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  // Format payload for JSONB
  const payload = items.map(item => ({
    id: item.id,
    product_id: item.product_id,
    returned_qty: item.returned_qty
  }))

  const { error } = await supabase.rpc('handle_return', {
    p_order_id: orderId,
    p_user_id: user.id,
    p_return_items: payload
  })

  if (error) {
    console.error('Handle return error:', error)
    return { error: error.message || 'Failed to handle return' }
  }

  revalidatePath('/returns')
  revalidatePath('/orders')
  revalidatePath('/dashboard')
  
  return { success: true }
}

export async function moveStock(productId: string, destinationLocationId: string, quantity: number, reasonCode: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase.rpc('move_stock_safe', {
    p_product_id: productId,
    p_location_id: destinationLocationId,
    p_qty: quantity,
    p_reason: reasonCode,
    p_user_id: user.id
  })

  if (error) {
    console.error('Move stock error:', error)
    return { error: error.message || 'ไม่สามารถย้ายสต็อกได้ (อาจมีคนดึงสต็อกไปก่อนหน้า)' }
  }

  revalidatePath('/putaway')
  revalidatePath('/dashboard')
  
  return { success: true }
}

export async function returnOrderToStock(orderId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase.rpc('return_order_to_stock', {
    p_order_id: orderId,
    p_user_id: user.id
  })

  if (error) {
    console.error('Return order error:', error)
    return { error: error.message || 'Failed to return order to stock' }
  }

  revalidatePath('/packing')
  revalidatePath('/dashboard')
  
  return { success: true }
}

export async function getProductInfo(sku: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('inventory_by_location_view')
    .select('*')
    .eq('sku', sku)

  if (error || !data || data.length === 0) {
    const { data: pData } = await supabase.from('products').select('*').eq('sku', sku).single()
    if (!pData) return { error: 'ไม่พบสินค้ารหัส ' + sku }
    return { 
      product: { sku: pData.sku, name: pData.name }, 
      total_qty: 0, 
      status: 'Out of Stock' 
    }
  }

  const totalQty = data.reduce((sum, item) => sum + Number(item.physical_qty), 0)
  
  return {
    product: { sku: data[0].sku, name: data[0].name },
    total_qty: totalQty,
    status: totalQty > 0 ? 'Available' : 'Out of Stock',
    locations: data.map(d => ({ zone: d.zone_name, qty: d.physical_qty }))
  }
}

export async function directOutbound(sku: string, qty: number = 1) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data, error } = await supabase.rpc('direct_outbound', {
    p_sku: sku,
    p_qty: qty,
    p_user_id: user.id
  })

  if (error) {
    return { error: 'ตัดสต็อกไม่สำเร็จ: ' + error.message }
  }

  if (data && data.success === false) {
    return { error: data.error }
  }

  revalidatePath('/packing')
  revalidatePath('/dashboard')
  revalidatePath('/owner/dashboard')

  return { success: true, product_name: data?.product_name, remaining: data?.remaining }
}

export async function directReturn(sku: string, qty: number = 1, reason: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data, error } = await supabase.rpc('direct_return', {
    p_sku: sku,
    p_qty: qty,
    p_user_id: user.id,
    p_reason: reason
  })

  if (error) {
    return { error: 'คืนสต็อกไม่สำเร็จ: ' + error.message }
  }

  if (data && data.success === false) {
    return { error: data.error }
  }

  revalidatePath('/packing')
  revalidatePath('/returns')
  revalidatePath('/dashboard')
  revalidatePath('/owner/dashboard')

  return { success: true, product_name: data?.product_name }
}
