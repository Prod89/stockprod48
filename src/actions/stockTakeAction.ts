'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function adjustStock(productId: string, locationId: string, diffQty: number, reasonCode: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase.from('stock_ledger').insert({
    product_id: productId,
    location_id: locationId,
    transaction_type: 'ADJUST',
    quantity: diffQty, // Negative for missing stock, positive for found stock
    reason_code: reasonCode,
    user_id: user.id
  })

  if (error) {
    console.error('Stock adjust error:', error)
    return { error: 'Failed to adjust stock' }
  }

  revalidatePath('/stock-take')
  revalidatePath('/dashboard')
  
  return { success: true }
}
