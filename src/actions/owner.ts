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
