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
