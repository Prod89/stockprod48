import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'WMS สต็อก — ระบบจัดการคลังสินค้า',
    short_name: 'WMS สต็อก',
    description: 'ระบบจัดการคลังสินค้าสำหรับร้านขายส่งเสื้อผ้าออนไลน์',
    start_url: '/dashboard',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#0f172a',
    theme_color: '#6366f1',
    categories: ['business', 'productivity'],
    icons: [
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
