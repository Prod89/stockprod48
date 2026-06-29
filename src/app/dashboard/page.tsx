import { Header } from '@/components/layout/Header'
import Link from 'next/link'

export default async function DashboardPage() {
  return (
    <>
      <Header title="WMS Dashboard" />
      <div className="p-6 flex flex-col justify-start items-center min-h-[85vh] gap-8 pt-10 pb-32">
        
        <Link href="/inbound" className="w-full max-w-sm block">
          <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 py-10 px-8 rounded-[2rem] shadow-xl shadow-indigo-500/20 flex flex-col items-center justify-center gap-4 transition-transform active:scale-95 hover:scale-105 border border-indigo-400/20">
            <svg className="w-14 h-14 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
            </svg>
            <span className="text-white text-3xl font-bold tracking-wide">รับเข้า</span>
          </div>
        </Link>

        <Link href="/packing" className="w-full max-w-sm block">
          <div className="bg-gradient-to-r from-violet-600 to-violet-800 py-10 px-8 rounded-[2rem] shadow-xl shadow-violet-500/20 flex flex-col items-center justify-center gap-4 transition-transform active:scale-95 hover:scale-105 border border-violet-400/20">
            <svg className="w-14 h-14 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <span className="text-white text-3xl font-bold tracking-wide">จัดแพ็ค</span>
          </div>
        </Link>

        <Link href="/stock-take" className="w-full max-w-sm block">
          <div className="bg-gradient-to-r from-amber-600 to-amber-800 py-10 px-8 rounded-[2rem] shadow-xl shadow-amber-500/20 flex flex-col items-center justify-center gap-4 transition-transform active:scale-95 hover:scale-105 border border-amber-400/20">
            <svg className="w-14 h-14 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
            <span className="text-white text-3xl font-bold tracking-wide">เช็คสต็อก</span>
          </div>
        </Link>

      </div>
    </>
  )
}
