// Database types matching Supabase schema

export type UserRole = 'owner' | 'staff'

export type ProductGrade = 'Premium' | '1' | '2' | '3'

export type TransactionType = 'IN' | 'OUT' | 'MOVE' | 'ADJUST'

export type OrderStatus = 'PENDING' | 'SHIPPED' | 'RETURNED' | 'CANCELLED'

export interface Profile {
  id: string
  full_name: string
  role: UserRole
  created_at: string
  updated_at: string
}

export interface Product {
  id: string
  sku: string
  name: string
  cost_price: number | null // null for staff (hidden via secure view)
  grade: ProductGrade | null
  created_at: string
  updated_at: string
}

export interface Location {
  id: string
  zone_name: string
  barcode_ref: string
  created_at: string
}

export interface StockLedgerEntry {
  id: string
  product_id: string
  location_id: string | null
  transaction_type: TransactionType
  quantity: number
  image_proof_url: string | null
  user_id: string
  created_at: string
}

export interface StockLedgerInsert {
  product_id: string
  location_id?: string | null
  transaction_type: TransactionType
  quantity: number
  image_proof_url?: string | null
  user_id: string
}

export interface OrderHeader {
  id: string
  customer_name: string
  status: OrderStatus
  total_amount: number
  user_id: string
  created_at: string
  updated_at: string
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  ordered_qty: number
  shipped_qty: number
  returned_qty: number
  selling_price: number
  created_at: string
}

export interface AvailableStockView {
  product_id: string
  sku: string
  name: string
  grade: ProductGrade | null
  physical_qty: number
  reserved_qty: number
  available_qty: number
}

export interface AuditLog {
  id: string
  table_name: string
  action_type: string
  record_id: string
  user_id: string
  device_info: string | null
  old_data: any
  new_data: any
  created_at: string
}

export interface ValuationSummaryView {
  grade: ProductGrade
  total_items: number
  total_value: number
}

export interface DeadStockView {
  product_id: string
  sku: string
  name: string
  stranded_qty: number
  cost_price: number
  stranded_value: number
}
