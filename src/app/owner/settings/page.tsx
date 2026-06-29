import { getAllProfiles } from '@/actions/owner'
import { Header } from '@/components/layout/Header'
import { UserManagement } from '@/components/owner/UserManagement'
import { CsvImport } from '@/components/owner/CsvImport'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'ตั้งค่าระบบ — WMS สต็อก',
}

export default async function SettingsPage() {
  const profiles = await getAllProfiles()

  return (
    <>
      <Header title="ตั้งค่าระบบ" showBack backHref="/dashboard" />
      <div className="p-4 pb-32 space-y-8">
        {/* User Management & Security Lockdown */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-lg font-bold text-white">จัดการผู้ใช้งานระบบ</h2>
          </div>
          <UserManagement initialProfiles={profiles} />
        </section>

        {/* Offline Recovery / CSV Import */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-lg font-bold text-white">นำเข้าข้อมูล (Data Import)</h2>
          </div>
          <CsvImport />
        </section>
      </div>
    </>
  )
}
