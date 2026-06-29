'use server'

import { createClient } from '@/lib/supabase/server'
import { TransactionType } from '@/lib/types/database'

export async function getRecentTransactions(type: TransactionType, limit = 10) {
  const supabase = await createClient()
  
  // We join profiles via user_id to get full_name
  const { data, error } = await supabase
    .from('stock_ledger')
    .select(`
      id,
      created_at,
      quantity,
      transaction_type,
      products:product_id(sku, name),
      locations:location_id(zone_name),
      profiles:user_id(full_name)
    `)
    .eq('transaction_type', type)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Recent transactions fetch error:', error)
    return []
  }

  return data || []
}
