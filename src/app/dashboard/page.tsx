import { Header } from '@/components/layout/Header'
import Link from 'next/link'

export default async function DashboardPage() {
  return (
    <>
      <Header title="WMS Dashboard" />
      <div className="p-4 flex flex-col justify-center items-center h-[80vh] gap-6">
        
        <Link href="/inbound" className="w-full max-w-sm">
          <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 p-8 rounded-3xl shadow-xl shadow-indigo-500/20 flex flex-col items-center justify-center gap-3 transition-transform active:scale-95 hover:scale-105">
            <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
            </svg>
            <span className="text-white text-2xl font-bold">รับเข้า</span>
          </div>
        </Link>

        <Link href="/packing" className="w-full max-w-sm">
          <div className="bg-gradient-to-r from-violet-600 to-violet-800 p-8 rounded-3xl shadow-xl shadow-violet-500/20 flex flex-col items-center justify-center gap-3 transition-transform active:scale-95 hover:scale-105">
            <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <span className="text-white text-2xl font-bold">จัดแพ็ค</span>
          </div>
        </Link>

        <Link href="/stock-take" className="w-full max-w-sm">
          <div className="bg-gradient-to-r from-amber-600 to-amber-800 p-8 rounded-3xl shadow-xl shadow-amber-500/20 flex flex-col items-center justify-center gap-3 transition-transform active:scale-95 hover:scale-105">
            <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
            <span className="text-white text-2xl font-bold">เช็คสต็อก</span>
          </div>
        </Link>

      </div>
    </>
  )
}
