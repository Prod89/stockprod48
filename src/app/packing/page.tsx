import { Header } from '@/components/layout/Header'
import { LivePackingScanner } from '@/components/packing/LivePackingScanner'

export default function PackingPage() {
  return (
    <>
      <Header title="แพ็คของ (Packing)" showBack backHref="/dashboard" />
      <div className="p-4 pb-32">
        <LivePackingScanner />
      </div>
    </>
  )
}
