import { getProducts, getLocations } from '@/actions/inbound'
import { Header } from '@/components/layout/Header'
import { StockTakeScanner } from '@/components/stock/StockTakeScanner'
import { createClient } from '@/lib/supabase/server'

export default async function StockTakePage() {
  const products = await getProducts()
  const locations = await getLocations()
  
  const supabase = await createClient()
  
  // To keep it simple and robust, we fetch AvailableStockView to show expected total qty
  const { data: stockView } = await supabase.from('available_stock_view').select('product_id, physical_qty')

  return (
    <>
      <Header title="เช็คสต็อก (Stock Take)" showBack backHref="/dashboard" />
      <div className="p-4 pb-32">
        <StockTakeScanner products={products} locations={locations} stockView={stockView || []} />
      </div>
    </>
  )
}
