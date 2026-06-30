'use client'

import { Card } from '@/components/ui/Card'

export function StaffManual() {
  return (
    <div className="space-y-6">
      <div className="bg-indigo-900/50 border border-indigo-500/30 p-5 rounded-2xl">
        <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
          <span className="text-2xl">👤</span> คู่มือการใช้งานสำหรับพนักงาน (Staff)
        </h2>
        <p className="text-sm text-indigo-200">
          คำอธิบายแบบละเอียด พร้อมตัวอย่างการทำงานทีละขั้นตอน (Step-by-Step)
        </p>
      </div>

      <div className="space-y-6">
        {/* 1. Inbound */}
        <Card padding="md" className="border-l-4 border-l-blue-500">
          <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-3">
            <span className="bg-blue-500/20 p-2 rounded-lg">📥</span> 1. รับเข้าสินค้า (Inbound)
          </h3>
          <div className="space-y-4 text-sm text-slate-300">
            <p><strong>จุดประสงค์:</strong> เพื่อนำสินค้าล็อตใหม่เข้าสู่ระบบ หรือเติมสต็อกสินค้าเดิม</p>
            
            <div className="bg-white/5 p-3 rounded-lg border border-white/10">
              <p className="font-bold text-white mb-2">📌 ตัวอย่าง: การนำกางเกงยีนส์แบบใหม่เข้าคลัง (ยังไม่เคยมีในระบบ)</p>
              <ol className="list-decimal pl-5 space-y-2">
                <li>เปิดไปที่หน้า <strong>"สินค้าเข้า"</strong></li>
                <li>คลิกเลือกแท็บ <strong>"สร้างสินค้าใหม่" (Gen SKU)</strong></li>
                <li><strong>หมวดหมู่:</strong> พิมพ์หรือเลือกหมวดหมู่ เช่น <code>Jeans</code> (ระบบจะใช้ตัวอักษร 3 ตัวแรกสร้าง SKU)</li>
                <li><strong>ชื่อสินค้า:</strong> พิมพ์ "กางเกงยีนส์ขาสั้นวินเทจ"</li>
                <li><strong>เกรดสินค้า:</strong> เลือกเกรด เช่น <code>Premium</code></li>
                <li><strong>จำนวน:</strong> ใส่จำนวนที่นับได้ เช่น <code>50</code> ชิ้น</li>
                <li><strong>พิกัด (Location):</strong> สแกนหรือเลือกพิกัดที่เก็บ เช่น <code>ZONE-A1</code></li>
                <li>กดปุ่ม <strong>"บันทึกรับเข้า"</strong></li>
                <li className="text-emerald-400">✅ ระบบจะสร้างรหัส <code>JEA-0001</code> ให้ทันที คุณสามารถกด "พิมพ์ป้าย" เพื่อปริ้นท์บาร์โค้ดไปแปะที่สินค้าได้เลย</li>
              </ol>
            </div>

            <div className="bg-white/5 p-3 rounded-lg border border-white/10">
              <p className="font-bold text-white mb-2">📌 ตัวอย่าง: การเติมสต็อกสินค้าเดิม (มีบาร์โค้ดแล้ว)</p>
              <ol className="list-decimal pl-5 space-y-2">
                <li>เปิดไปที่หน้า <strong>"สินค้าเข้า"</strong> และอยู่ในแท็บ <strong>"สแกนรับเข้า"</strong></li>
                <li>ใช้เครื่องสแกน <strong>ยิงบาร์โค้ด</strong> ที่ตัวสินค้า (หรือพิมพ์ SKU)</li>
                <li>ระบบจะแสดงชื่อสินค้าขึ้นมาอัตโนมัติ</li>
                <li>ใส่จำนวนชิ้นที่ต้องการเติม และเลือกพิกัดที่เก็บ</li>
                <li>กดปุ่ม <strong>"บันทึกรับเข้า"</strong> สต็อกจะบวกเพิ่มทันที</li>
              </ol>
            </div>
          </div>
        </Card>

        {/* 2. Packing */}
        <Card padding="md" className="border-l-4 border-l-emerald-500">
          <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-3">
            <span className="bg-emerald-500/20 p-2 rounded-lg">📦</span> 2. เบิกรอขาย / แพ็คของ (Packing)
          </h3>
          <div className="space-y-4 text-sm text-slate-300">
            <p><strong>จุดประสงค์:</strong> สำหรับสแกนตัดสต็อกทีละ 1 ชิ้นอย่างรวดเร็ว เวลากำลังแพ็คของลงกล่อง หรือตอนไลฟ์สด</p>

            <div className="bg-white/5 p-3 rounded-lg border border-white/10">
              <p className="font-bold text-white mb-2">📌 ตัวอย่าง: ลูกค้าสั่งซื้อเสื้อ 2 ตัว (กำลังหยิบแพ็ค)</p>
              <ol className="list-decimal pl-5 space-y-2">
                <li>เปิดหน้า <strong>"เบิกรอขาย"</strong> (ระบบจะตั้งค่าเริ่มต้นเป็นโหมด <strong>"ตัดสต็อก"</strong> สีเขียว)</li>
                <li>หยิบเสื้อตัวที่ 1 &rarr; <strong>สแกนบาร์โค้ด</strong> &rarr; หน้าจอจะขึ้นปุ่มสีเขียว "ยืนยันการจัดส่ง (หัก 1 ชิ้น)"</li>
                <li>กดยืนยัน (หรือกด Enter) &rarr; สต็อกจะถูกหัก 1 ชิ้นทันที มีเสียงแจ้งเตือนสำเร็จ</li>
                <li>หยิบเสื้อตัวที่ 2 &rarr; <strong>สแกนบาร์โค้ด</strong> &rarr; กดยืนยัน</li>
                <li>ดูที่ <strong>"ประวัติการเบิกสินค้าล่าสุด"</strong> ด้านล่างสุด จะมีชื่อคุณเป็นคนทำรายการเบิก 2 รายการนี้</li>
              </ol>
            </div>

            <div className="bg-red-500/10 p-3 rounded-lg border border-red-500/20">
              <p className="font-bold text-red-300 mb-2">⚠️ วิธีแก้ไขเมื่อ "สแกนผิดชิ้น" หรือ "ลูกค้ากดยกเลิกออเดอร์"</p>
              <ul className="list-disc pl-5 space-y-2 text-red-200">
                <li><strong>วิธีที่ 1:</strong> เลื่อนลงไปดูประวัติการสแกนด้านล่าง กดคำว่า <strong>"สแกนผิด (ยกเลิก)"</strong> ที่รายการนั้น สต็อกจะเด้งกลับคืนทันที</li>
                <li><strong>วิธีที่ 2:</strong> กดเปลี่ยนโหมดด้านบนเป็น <strong>"คืนสต็อก (Return)" สีส้ม</strong> &rarr; สแกนสินค้าชิ้นนั้น &rarr; เลือกเหตุผล "สแกนผิดพลาด" &rarr; กดยืนยัน (สต็อกจะบวกกลับ +1)</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* 3. Putaway */}
        <Card padding="md" className="border-l-4 border-l-cyan-500">
          <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-3">
            <span className="bg-cyan-500/20 p-2 rounded-lg">🗄️</span> 3. สินค้าเหลือส่งคืน (Putaway)
          </h3>
          <div className="space-y-4 text-sm text-slate-300">
            <p><strong>จุดประสงค์:</strong> เมื่อหยิบของมาเกิน หรือลูกค้าคืนของ แล้วกองอยู่หน้าโต๊ะแพ็ค ต้องเอาของไปเก็บคืนเข้าชั้นวางให้ถูกต้อง (ย้ายพิกัด)</p>

            <div className="bg-white/5 p-3 rounded-lg border border-white/10">
              <p className="font-bold text-white mb-2">📌 ตัวอย่าง: ย้ายเสื้อจากโต๊ะแพ็ค กลับไปไว้ที่ชั้น B2</p>
              <ol className="list-decimal pl-5 space-y-2">
                <li>เปิดหน้า <strong>"สินค้าเหลือส่งคืน"</strong> (จะเห็นขั้นตอน 1-2-3 ด้านบน)</li>
                <li><strong>ขั้นตอนที่ 1 (สแกนสินค้า):</strong> สแกนบาร์โค้ดที่ตัวเสื้อ</li>
                <li><strong>ขั้นตอนที่ 2 (สแกนพิกัด):</strong> เดินไปที่ชั้น B2 แล้วสแกนบาร์โค้ดตำแหน่ง (Location Barcode) ของชั้น B2</li>
                <li><strong>ขั้นตอนที่ 3 (ยืนยัน):</strong> ใส่จำนวนชิ้นที่เอามาเก็บ (เช่น 3 ชิ้น)</li>
                <li>เลือกเหตุผล: <code>ย้ายเข้าชั้นวาง (Move to Shelf)</code></li>
                <li>กด <strong>"ยืนยันการย้าย"</strong> &rarr; สินค้าจะถูกย้ายในระบบจากพิกัดเดิม มาอยู่ที่พิกัด B2 เรียบร้อย</li>
              </ol>
            </div>
          </div>
        </Card>

        {/* 4. Stock Take */}
        <Card padding="md" className="border-l-4 border-l-amber-500">
          <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-3">
            <span className="bg-amber-500/20 p-2 rounded-lg">📋</span> 4. นับสต็อก (Stock Take)
          </h3>
          <div className="space-y-4 text-sm text-slate-300">
            <p><strong>จุดประสงค์:</strong> ตรวจนับของจริงๆ ที่อยู่ในโกดัง ว่าตรงกับตัวเลขในระบบหรือไม่ หากไม่ตรง ระบบจะปรับยอดให้ใหม่ทันที</p>

            <div className="bg-white/5 p-3 rounded-lg border border-white/10">
              <p className="font-bold text-white mb-2">📌 ตัวอย่าง: ของในระบบมี 10 ชิ้น แต่เดินไปนับจริงเจอแค่ 8 ชิ้น (ของหาย)</p>
              <ol className="list-decimal pl-5 space-y-2">
                <li>เปิดหน้า <strong>"นับสต็อก"</strong></li>
                <li><strong>สแกนสินค้า:</strong> สแกนบาร์โค้ดของสินค้านั้น (หน้าจอจะแสดงเป้าหมายว่า ระบบคาดว่าควรมี 10 ชิ้น)</li>
                <li><strong>สแกนพิกัด:</strong> สแกนป้ายตำแหน่งที่กำลังยืนนับอยู่ (เช่น A1)</li>
                <li><strong>นับจริงได้กี่ชิ้น?:</strong> ให้พิมพ์เลข <code>8</code> ลงในช่อง (ใส่จำนวนที่ตาเห็นจริงๆ)</li>
                <li>กด <strong>"บันทึกการนับ (ยืนยันปรับยอด)"</strong></li>
                <li className="text-amber-400">⚠️ ระบบจะปรับสต็อกรวมของสินค้านี้ให้เหลือ 8 ชิ้น และบันทึกประวัติไว้ว่าคุณเป็นคนตรวจพบของหาย (-2 ชิ้น)</li>
              </ol>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
