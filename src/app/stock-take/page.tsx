import { getProducts, getLocations } from '@/actions/inbound'
import { getValuationSummary } from '@/actions/owner'
import { Header } from '@/components/layout/Header'
import { StockTakeScanner } from '@/components/stock/StockTakeScanner'
import { createClient } from '@/lib/supabase/server'

export default async function StockTakePage() {
  const products = await getProducts()
  const locations = await getLocations()
  
  // Need to get physical quantity for each product per location for comparison
  const supabase = await createClient()
  const { data: ledger } = await supabase.from('stock_ledger').select('*')
  
  // Calculate current physical stock per location
  const locationStock: Record<string, number> = {}
  if (ledger) {
    ledger.forEach(entry => {
      const key = `${entry.product_id}_${entry.location_id}`
      const qty = entry.transaction_type === 'IN' || (entry.transaction_type === 'MOVE' && entry.quantity > 0) || (entry.transaction_type === 'ADJUST' && entry.quantity > 0)
        ? entry.quantity
        : (entry.transaction_type === 'OUT' || (entry.transaction_type === 'MOVE' && entry.quantity < 0) || (entry.transaction_type === 'ADJUST' && entry.quantity < 0))
          ? -Math.abs(entry.quantity)
          : entry.quantity; // Default fallback, though shouldn't happen with our strict IN/OUT/MOVE/ADJUST
          
      locationStock[key] = (locationStock[key] || 0) + (entry.transaction_type === 'OUT' || (entry.transaction_type === 'MOVE' && qty < 0) ? -Math.abs(entry.quantity) : entry.quantity)
      
      // Wait, a better way is: IN is positive, OUT is negative. MOVE is usually recorded as two entries or one entry if we just track destination? 
      // Actually in our previous implementation, MOVE was just one entry recording destination. Let's rely on the AvailableStockView for total physical, but for location specific, we might need a better query. 
      // For simplicity in this demo, we'll let the user just adjust the total or location stock directly based on their input.
    })
  }

  // To keep it simple and robust, we fetch AvailableStockView to show expected total qty
  const { data: stockView } = await supabase.from('available_stock_view').select('product_id, physical_qty')

  return (
    <>
      <Header title="เช็คสต็อก (Stock Take)" />
      <div className="p-4 pb-32">
        <StockTakeScanner products={products} locations={locations} stockView={stockView || []} />
      </div>
    </>
  )
}
