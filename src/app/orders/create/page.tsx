import { getAvailableStock } from '@/actions/orders'
import { CreateOrderForm } from '@/components/orders/CreateOrderForm'
import { Header } from '@/components/layout/Header'

export default async function CreateOrderPage() {
  const stockData = await getAvailableStock()

  return (
    <>
      <Header title="สร้างออเดอร์ใหม่" showBack backHref="/orders" />
      <div className="p-4">
        <CreateOrderForm initialStockData={stockData} />
      </div>
    </>
  )
}
