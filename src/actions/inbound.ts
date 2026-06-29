'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createInboundEntry(formData: FormData) {
  const supabase = await createClient()

  // Verify authentication
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'ไม่ได้เข้าสู่ระบบ กรุณาเข้าสู่ระบบใหม่' }
  }

  const productId = formData.get('product_id') as string
  const locationId = formData.get('location_id') as string
  const quantity = parseInt(formData.get('quantity') as string)
  const imageProofUrl = formData.get('image_proof_url') as string | null
  const grade = formData.get('grade') as string | null

  // Validation
  if (!productId) {
    return { error: 'กรุณาสแกนหรือเลือกสินค้า' }
  }
  if (!quantity || quantity < 1) {
    return { error: 'กรุณาระบุจำนวนที่ถูกต้อง (ต้องมากกว่า 0)' }
  }

  // Update product grade if specified
  if (grade) {
    const { error: gradeError } = await supabase
      .from('products')
      .update({ grade })
      .eq('id', productId)
    
    if (gradeError) {
      console.error('Grade update error:', gradeError)
      // Don't fail the whole operation for grade update
    }
  }

  // Insert stock ledger entry with server-side timestamp (DEFAULT now())
  const { data, error } = await supabase
    .from('stock_ledger')
    .insert({
      product_id: productId,
      location_id: locationId || null,
      transaction_type: 'IN',
      quantity,
      image_proof_url: imageProofUrl || null,
      user_id: user.id,
    })
    .select()
    .single()

  if (error) {
    console.error('Stock ledger insert error:', error)
    return { error: 'ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่อีกครั้ง' }
  }

  revalidatePath('/inbound')
  revalidatePath('/dashboard')

  return { success: true, data }
}

export async function createProductAndInboundEntry(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const name = formData.get('name') as string
  const category = formData.get('category') as string
  const lotDate = formData.get('lot_date') as string
  const warehouseCode = formData.get('warehouse_code') as string
  const costPrice = parseFloat(formData.get('cost_price') as string)
  const grade = formData.get('grade') as string
  const status = formData.get('status') as string || 'AVAILABLE'
  
  const locationId = formData.get('location_id') as string
  const quantity = parseInt(formData.get('quantity') as string)
  const imageProofUrl = formData.get('image_proof_url') as string | null

  // 1. Insert new product (Trigger will generate SKU)
  const { data: product, error: productError } = await supabase
    .from('products')
    .insert({
      name,
      category,
      lot_date: lotDate,
      warehouse_code: warehouseCode,
      cost_price: costPrice,
      grade,
      status,
      // No SKU here, let the trigger do it!
    })
    .select('id, sku, name')
    .single()

  if (productError || !product) {
    console.error('Product creation error:', productError)
    return { error: 'Failed to create product' }
  }

  // 2. Insert stock ledger
  const { error: ledgerError } = await supabase
    .from('stock_ledger')
    .insert({
      product_id: product.id,
      location_id: locationId || null,
      transaction_type: 'IN',
      quantity,
      image_proof_url: imageProofUrl || null,
      user_id: user.id,
    })

  if (ledgerError) {
    console.error('Stock ledger insert error:', ledgerError)
    return { error: 'Failed to record inbound stock' }
  }

  revalidatePath('/inbound')
  revalidatePath('/dashboard')

  return { success: true, sku: product.sku, name: product.name }
}

export async function getProducts() {
  const supabase = await createClient()
  
  // Use the safe view that hides cost_price for staff
  const { data, error } = await supabase
    .from('products_safe')
    .select('*')
    .order('name')

  if (error) {
    console.error('Products fetch error:', error)
    return []
  }

  return data || []
}

export async function getLocations() {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('locations')
    .select('*')
    .order('zone_name')

  if (error) {
    console.error('Locations fetch error:', error)
    return []
  }

  return data || []
}

export async function getRecentInbound(limit = 10) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('stock_ledger')
    .select(`
      *,
      products:product_id(sku, name, grade),
      locations:location_id(zone_name, barcode_ref)
    `)
    .eq('transaction_type', 'IN')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Recent inbound fetch error:', error)
    return []
  }

  return data || []
}
