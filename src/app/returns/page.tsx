import { getRecentOrders } from '@/actions/orders'
import { Header } from '@/components/layout/Header'
import { ReturnForm } from '@/components/returns/ReturnForm'

export default async function ReturnsPage() {
  const shippedOrders = await getRecentOrders('SHIPPED')

  return (
    <>
      <Header title="คืนของ (Returns)" showBack backHref="/dashboard" />
      <div className="p-4 pb-32">
        <ReturnForm orders={shippedOrders} />
      </div>
    </>
  )
}
