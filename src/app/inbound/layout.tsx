import { Header } from '@/components/layout/Header'
import { MobileNav } from '@/components/layout/MobileNav'

export default function InboundLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col min-h-screen bg-slate-950">
      <Header />
      <main className="flex-1 pb-24">
        {children}
      </main>
      <MobileNav />
    </div>
  )
}
