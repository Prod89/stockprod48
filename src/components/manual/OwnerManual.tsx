'use client'

import { Card } from '@/components/ui/Card'

export function OwnerManual() {
  return (
    <div className="space-y-6">
      <div className="bg-amber-900/50 border border-amber-500/30 p-5 rounded-2xl">
        <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
          <span className="text-2xl">👑</span> คู่มือการใช้งานสำหรับเจ้าของร้าน (Owner)
        </h2>
        <p className="text-sm text-amber-200">
          เรียนรู้วิธีการดูรายงานเชิงลึก การจัดการสินค้า การดูต้นทุน และกำไร
        </p>
      </div>

      <div className="space-y-4">
        {/* 1. Dashboard */}
        <Card padding="md" className="border-l-4 border-l-purple-500">
          <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-3">
            <span className="bg-purple-500/20 p-2 rounded-lg">📊</span> 1. แดชบอร์ดผู้บริหาร (Dashboard)
          </h3>
          <div className="space-y-2 text-sm text-slate-300">
            <p className="font-medium text-white mb-1">หน้าสรุปภาพรวมทั้งหมดของร้าน:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong className="text-purple-300">มูลค่าสินทรัพย์รวม (Stock Value):</strong> ดูเงินทุนที่จมอยู่ในสต็อก แบ่งเป็นของพร้อมขาย และของที่อยู่ในกระสอบ</li>
              <li><strong className="text-red-300">การแจ้งเตือนสินค้าใกล้หมด (Low Stock):</strong> สินค้าที่เหลือต่ำกว่า 5 ชิ้น เพื่อวางแผนสั่งซื้อ</li>
              <li><strong className="text-emerald-300">สรุปยอดขาย (Sales Analytics):</strong> ยอดขายวันนี้/เดือนนี้ และ Top 10 สินค้าขายดี</li>
              <li><strong className="text-amber-300">วิเคราะห์อายุสินค้า (Aging Analysis):</strong> ดูว่าของเข้าใหม่ หรือของค้างสต็อกนานเกินไปมีเยอะแค่ไหน เพื่อจัดโปรโมชั่นระบายของ</li>
              <li><strong className="text-indigo-300">กำไร-ขาดทุนรายล็อต (Profitability):</strong> เปรียบเทียบต้นทุนที่รับมา กับยอดที่ขายได้จริง เพื่อดูกำไรสุทธิของแต่ละล็อต</li>
            </ul>
          </div>
        </Card>

        {/* 2. Inventory Management */}
        <Card padding="md" className="border-l-4 border-l-indigo-500">
          <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-3">
            <span className="bg-indigo-500/20 p-2 rounded-lg">🔍</span> 2. คลังสินค้าเชิงลึก (Inventory)
          </h3>
          <div className="space-y-2 text-sm text-slate-300">
            <ul className="list-disc pl-5 space-y-2">
              <li>ดูรายการสินค้าทั้งหมดในระบบอย่างละเอียด พร้อมช่องค้นหา</li>
              <li><strong>การแก้ไขชื่อและรายละเอียด:</strong> สามารถกดไอคอน ✎ เพื่อเปลี่ยนชื่อ หรือเปลี่ยนหมวดหมู่/ล็อตได้ทันที</li>
              <li><strong>การปรับต้นทุน (Cost Price):</strong> เจ้าของร้านสามารถแก้ไขราคาต้นทุนของสินค้าได้ (พนักงานจะไม่เห็นข้อมูลนี้)</li>
            </ul>
          </div>
        </Card>

        {/* 3. Settings & Tools */}
        <Card padding="md" className="border-l-4 border-l-rose-500">
          <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-3">
            <span className="bg-rose-500/20 p-2 rounded-lg">⚙️</span> 3. เครื่องมือหลังบ้าน
          </h3>
          <div className="space-y-2 text-sm text-slate-300">
            <p className="font-medium text-white mb-1">อยู่ในหน้าแดชบอร์ด เลื่อนลงมาด้านล่างสุด:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong className="text-rose-300">บันทึกต้นทุนกระสอบ (Bale Cost):</strong> 
                บันทึกค่ากระสอบ ค่าขนส่ง ค่าอื่นๆ ประจำล็อต เพื่อให้ระบบคำนวณ ต้นทุนเฉลี่ย/ชิ้น อัตโนมัติ นำไปใช้เป็น cost_price ได้
              </li>
              <li>
                <strong className="text-cyan-300">นำเข้าข้อมูลย้อนหลัง (CSV Import):</strong> 
                กรณีเน็ตล่ม หรือมีฐานข้อมูลเก่า สามารถอัปโหลดไฟล์ CSV เป็น Batch เพื่อคีย์สต็อกทีละหลายรายการได้
              </li>
              <li>
                <strong className="text-amber-300">ประวัติการทำงาน (Audit Logs):</strong> 
                ตรวจสอบย้อนหลังว่า พนักงานคนไหน ทำรายการอะไร เมื่อไหร่ (ใครรับเข้า ใครย้ายของ) มีชื่อกำกับทุกแอคชั่น
              </li>
              <li>
                <strong className="text-emerald-300">จัดการผู้ใช้งาน (User Management):</strong> 
                เพิ่ม/ลบ สิทธิ์พนักงาน หรือเปลี่ยนรหัสผ่านให้พนักงานได้
              </li>
            </ul>
          </div>
        </Card>
      </div>
    </div>
  )
}
