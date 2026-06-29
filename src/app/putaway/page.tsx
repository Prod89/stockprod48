import { getProducts, getLocations } from '@/actions/inbound'
import { Header } from '@/components/layout/Header'
import { PutawayScanner } from '@/components/putaway/PutawayScanner'

export default async function PutawayPage() {
  const products = await getProducts()
  const locations = await getLocations()

  return (
    <>
      <Header title="ย้ายโซน (Put-away)" showBack backHref="/dashboard" />
      <div className="p-4 pb-32">
        <PutawayScanner products={products} locations={locations} />
      </div>
    </>
  )
}
