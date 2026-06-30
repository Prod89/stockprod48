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
          คำอธิบายแบบละเอียด พร้อมตัวอย่างการวิเคราะห์ข้อมูลเชิงลึก และการตั้งค่าระบบ
        </p>
      </div>

      <div className="space-y-6">
        {/* 1. Dashboard */}
        <Card padding="md" className="border-l-4 border-l-purple-500">
          <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-3">
            <span className="bg-purple-500/20 p-2 rounded-lg">📊</span> 1. แดชบอร์ดผู้บริหาร (Dashboard)
          </h3>
          <div className="space-y-4 text-sm text-slate-300">
            <p><strong>จุดประสงค์:</strong> ดูภาพรวมสุขภาพของธุรกิจ สต็อกจม กำไร ขาดทุน โดยสรุปในหน้าเดียว</p>

            <div className="bg-white/5 p-3 rounded-lg border border-white/10">
              <p className="font-bold text-white mb-2">📌 ตัวอย่าง: การเช็คว่ามี "เงินจม" ในโกดังเท่าไหร่?</p>
              <ol className="list-decimal pl-5 space-y-2">
                <li>เปิดหน้า <strong>"เมนูหลัก" (Dashboard)</strong></li>
                <li>ดูที่กล่อง <strong>"มูลค่าสินทรัพย์รวม (Stock Value)"</strong> จะเห็นตัวเลข 2 ส่วน:
                  <ul className="list-disc pl-5 mt-1 text-slate-400">
                    <li><span className="text-emerald-400">พร้อมขาย (AVAILABLE):</span> มูลค่าของที่แกะกระสอบแล้ว พร้อมให้พนักงานหยิบแพ็ค</li>
                    <li><span className="text-amber-400">ทุนจมกระสอบ (IN-BALE):</span> มูลค่ากระสอบที่ยังไม่ได้แกะ หรือยังไม่ได้คัดแยก (เงินก้อนนี้ยังแปลงเป็นยอดขายไม่ได้ทันที)</li>
                  </ul>
                </li>
                <li>เลื่อนลงไปดูที่ <strong>"แจ้งเตือนเงินจม (ZONE-RETURN)"</strong> จะแสดงรายการสินค้าที่ลูกค้ายกเลิก/ส่งคืน แล้วพนักงานเอามากองไว้ที่โซนคืนของ แต่ยังไม่ยอมเอาไปเก็บเข้าชั้นวาง (ทำให้พนักงานแพ็คหาของไม่เจอ เสียโอกาสขาย)</li>
              </ol>
            </div>
            
            <div className="bg-white/5 p-3 rounded-lg border border-white/10">
              <p className="font-bold text-white mb-2">📌 ตัวอย่าง: ดูว่าล็อตกางเกงยีนส์ที่เพิ่งลง ขาดทุนหรือกำไร?</p>
              <ol className="list-decimal pl-5 space-y-2">
                <li>เลื่อนไปที่ส่วน <strong>"สรุปกำไร-ขาดทุนรายล็อต (Profitability)"</strong></li>
                <li>ระบบจะเอายอด "ต้นทุนกระสอบ (Bale Cost)" มาหักลบกับ "ยอดขายที่ขายออกไปแล้ว" ของล็อตนั้น</li>
                <li>ถ้าหลอดเป็น<span className="text-red-400">สีแดง</span> แปลว่ายังขายได้ไม่คุ้มทุนกระสอบที่จ่ายไป ให้รีบจัดโปรโมชั่นดันของ</li>
                <li>ถ้าหลอดเป็น<span className="text-emerald-400">สีเขียว</span> แปลว่าคืนทุนแล้ว และที่เหลือคือ "กำไรล้วนๆ"</li>
              </ol>
            </div>
          </div>
        </Card>

        {/* 2. Inventory */}
        <Card padding="md" className="border-l-4 border-l-indigo-500">
          <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-3">
            <span className="bg-indigo-500/20 p-2 rounded-lg">🔍</span> 2. คลังสินค้าเชิงลึก (Inventory)
          </h3>
          <div className="space-y-4 text-sm text-slate-300">
            <p><strong>จุดประสงค์:</strong> สำหรับเจ้าของร้านเข้ามาจัดการหลังบ้าน แก้ไขข้อมูลสินค้าที่พนักงานอาจจะพิมพ์ผิด หรือปรับราคาต้นทุน</p>

            <div className="bg-white/5 p-3 rounded-lg border border-white/10">
              <p className="font-bold text-white mb-2">📌 ตัวอย่าง: การแก้ไข "ต้นทุน (Cost Price)" ของสินค้า</p>
              <ol className="list-decimal pl-5 space-y-2">
                <li>เข้าเมนู <strong>"คลังสินค้าเชิงลึก"</strong> (มีเฉพาะ Owner ที่เข้าได้)</li>
                <li>ค้นหาชื่อ หรือ SKU สินค้าที่ต้องการแก้ไข ในช่องค้นหา</li>
                <li>คลิกที่ไอคอน <strong>รูปดินสอ ✎ (Edit)</strong> ท้ายรายการสินค้านั้น</li>
                <li>ลบเลขต้นทุนเดิม แล้วพิมพ์เลขต้นทุนที่ถูกต้องลงไป (เช่น รับมาตัวละ 120 บาท)</li>
                <li>กดปุ่ม <strong>"บันทึก (Save)"</strong> สีเขียว (ข้อมูลต้นทุนนี้พนักงานจะไม่สามารถมองเห็นได้ ป้องกันความลับธุรกิจ)</li>
              </ol>
            </div>
          </div>
        </Card>

        {/* 3. Bale Cost */}
        <Card padding="md" className="border-l-4 border-l-rose-500">
          <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-3">
            <span className="bg-rose-500/20 p-2 rounded-lg">📦</span> 3. บันทึกต้นทุนกระสอบ (Bale Cost)
          </h3>
          <div className="space-y-4 text-sm text-slate-300">
            <p><strong>จุดประสงค์:</strong> เพื่อให้ระบบคำนวณว่า เสื้อ 1 ตัว ในกระสอบนี้ ตกต้นทุนตัวละกี่บาท</p>

            <div className="bg-white/5 p-3 rounded-lg border border-white/10">
              <p className="font-bold text-white mb-2">📌 ตัวอย่าง: ซื้อกระสอบเสื้อยืดมา 5,000 บาท แกะได้ 100 ตัว</p>
              <ol className="list-decimal pl-5 space-y-2">
                <li>เปิดหน้า <strong>"เมนูหลัก" (Dashboard)</strong> แล้วเลื่อนลงมาล่างสุด</li>
                <li>ไปที่ส่วน <strong>"บันทึกต้นทุนกระสอบ (Bale Cost Manager)"</strong></li>
                <li><strong>ชื่อกระสอบ/ล็อต:</strong> พิมพ์ <code>เสื้อยืดUSA-ล็อต01</code></li>
                <li><strong>ต้นทุนรวม (บาท):</strong> พิมพ์ <code>5000</code> (รวมค่าส่ง ค่าน้ำมันแล้ว)</li>
                <li><strong>จำนวนตัวที่คัดได้ (ตัว):</strong> พิมพ์ <code>100</code></li>
                <li>กดปุ่ม <strong>"บันทึก & คำนวณ"</strong></li>
                <li className="text-emerald-400">✅ ระบบจะคำนวณและแสดงให้เห็นว่า ต้นทุนเฉลี่ยตก <strong>50 บาท/ตัว</strong> ให้คุณจำเลขนี้ไว้ไปใส่เป็น Cost Price ตอนตั้งรหัส SKU ได้เลย</li>
              </ol>
            </div>
          </div>
        </Card>

        {/* 4. Audit & Setup */}
        <Card padding="md" className="border-l-4 border-l-slate-500">
          <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-3">
            <span className="bg-slate-500/20 p-2 rounded-lg">⚙️</span> 4. ประวัติการทำงาน & การตั้งค่าพนักงาน
          </h3>
          <div className="space-y-4 text-sm text-slate-300">
            
            <div className="bg-white/5 p-3 rounded-lg border border-white/10">
              <p className="font-bold text-white mb-2">📌 การตรวจสอบจับผิด (Audit Logs)</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>อยู่ในหน้า <strong>Dashboard ล่างสุด</strong></li>
                <li>ใช้ดูว่า <strong>ใคร (ชื่ออะไร) ทำอะไร เมื่อไหร่</strong> เช่น "นาย A เบิกเสื้อออกไป 1 ชิ้น ตอน 14:00น."</li>
                <li>หากพบว่าสต็อกหาย หรือจำนวนไม่ตรง ให้มาเช็คที่นี่เพื่อหาตัวคนทำรายการผิดพลาด</li>
              </ul>
            </div>

            <div className="bg-white/5 p-3 rounded-lg border border-white/10">
              <p className="font-bold text-white mb-2">📌 การเพิ่มพนักงานใหม่ (User Management)</p>
              <ol className="list-decimal pl-5 space-y-2">
                <li>อยู่ในหน้า <strong>Dashboard ล่างสุด</strong> ส่วนจัดการผู้ใช้งาน</li>
                <li>ใส่อีเมล และรหัสผ่านที่ต้องการให้พนักงานใช้ล็อกอิน</li>
                <li>ใส่ชื่อ-นามสกุล หรือชื่อเล่นที่ใช้เรียกในโกดัง (ชื่อนี้จะไปโชว์ในประวัติการทำงาน)</li>
                <li>เลือกระดับสิทธิ์เป็น <code>staff</code></li>
                <li>กด <strong>"สร้างบัญชี"</strong> พนักงานสามารถใช้อีเมลนี้ล็อกอินเข้าเครื่องสแกนของตัวเองได้เลย</li>
              </ol>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
