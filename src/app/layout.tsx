import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { SyncStatus } from '@/components/ui/SyncStatus'
import './globals.css'

const inter = Inter({
  variable: '--font-geist-sans',
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'WMS สต็อก — ระบบจัดการคลังสินค้า',
  description: 'ระบบจัดการคลังสินค้าสำหรับร้านขายส่งเสื้อผ้าออนไลน์ Live Commerce',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'WMS สต็อก',
  },
  formatDetection: {
    telephone: false,
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#6366f1',
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="th" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-slate-950 text-white font-sans">
        <SyncStatus />
        {children}
      </body>
    </html>
  )
}
