'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function bulkImportLedger(entries: any[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Check if owner
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'owner') return { error: 'Forbidden: Owners only' }

  const { error } = await supabase.rpc('bulk_import_ledger', {
    p_entries: entries,
    p_user_id: user.id
  })

  if (error) {
    console.error('Bulk import error:', error)
    return { error: error.message || 'Failed to bulk import data' }
  }

  revalidatePath('/owner/dashboard')
  revalidatePath('/dashboard')
  
  return { success: true }
}
