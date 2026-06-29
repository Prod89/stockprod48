import { getRecentOrders } from '@/actions/orders'
import { Header } from '@/components/layout/Header'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import Link from 'next/link'
import { format } from 'date-fns'

export default async function OrdersPage() {
  const orders = await getRecentOrders()

  return (
    <>
      <Header title="ออเดอร์ (Orders)" />
      
      <div className="p-4 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-medium text-white">ออเดอร์ล่าสุด</h2>
          <Link href="/orders/create" className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-500 transition-colors">
            + สร้างออเดอร์
          </Link>
        </div>

        <div className="space-y-3">
          {orders.map((order: any) => (
            <Card key={order.id} padding="md" className="flex flex-col gap-3">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium text-white">{order.customer_name}</h3>
                  <p className="text-xs text-slate-400">{format(new Date(order.created_at), 'dd/MM/yyyy HH:mm')}</p>
                </div>
                <Badge 
                  variant={order.status === 'PENDING' ? 'warning' : order.status === 'SHIPPED' ? 'success' : order.status === 'RETURNED' ? 'error' : 'default'}
                >
                  {order.status}
                </Badge>
              </div>
              <div className="text-sm text-slate-300">
                รายการสินค้า: {order.order_items.length} รายการ
              </div>
              <div className="text-sm font-medium text-indigo-400">
                ยอดรวม: ฿{order.total_amount.toLocaleString()}
              </div>
            </Card>
          ))}
          {orders.length === 0 && (
            <div className="text-center py-10 text-slate-400">ไม่มีออเดอร์ในระบบ</div>
          )}
        </div>
      </div>
    </>
  )
}
