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
          เรียนรู้วิธีการทำงานหน้าร้าน การรับเข้า เบิกออก นับสต็อก และย้ายสินค้า
        </p>
      </div>

      <div className="space-y-4">
        {/* 1. Inbound */}
        <Card padding="md" className="border-l-4 border-l-blue-500">
          <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-3">
            <span className="bg-blue-500/20 p-2 rounded-lg">📥</span> 1. รับเข้าสินค้า (Inbound)
          </h3>
          <div className="space-y-2 text-sm text-slate-300">
            <p className="font-medium text-white mb-1">หน้าสำหรับนำสินค้าเข้าสู่คลัง แบ่งเป็น 2 กรณี:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong className="text-indigo-300">รับของเดิม:</strong> 
                สแกนบาร์โค้ด หรือพิมพ์ SKU ของสินค้าที่มีอยู่แล้วในระบบ &rarr; ระบุจำนวนและตำแหน่งที่ต้องการเก็บ &rarr; กด "บันทึกรับเข้า"
              </li>
              <li>
                <strong className="text-indigo-300">สร้างสินค้าใหม่ (Gen SKU):</strong> 
                กรณีสินค้าใหม่ที่ยังไม่เคยมีในระบบ ให้กดแท็บ "สร้างสินค้าใหม่" &rarr; กรอกชื่อ หมวดหมู่ รหัสโกดัง และระบุเกรด &rarr; ระบบจะสร้างรหัส SKU ให้โดยอัตโนมัติ 
                <br/><span className="text-slate-400 text-xs">* สามารถกด "พิมพ์ป้าย" เพื่อปริ้นท์บาร์โค้ดไปแปะที่สินค้าได้ทันที</span>
              </li>
            </ul>
          </div>
        </Card>

        {/* 2. Packing */}
        <Card padding="md" className="border-l-4 border-l-emerald-500">
          <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-3">
            <span className="bg-emerald-500/20 p-2 rounded-lg">📦</span> 2. เบิกรอขาย (Packing)
          </h3>
          <div className="space-y-2 text-sm text-slate-300">
            <p className="font-medium text-white mb-1">หน้าสำหรับเบิกของออก หรือ รับของคืนอย่างรวดเร็ว:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong className="text-emerald-400">โหมดตัดสต็อก (ขายออก):</strong> 
                สแกนบาร์โค้ดสินค้าที่ลูกค้าสั่งซื้อ เพื่อทำการหักสต็อกทีละ 1 ชิ้น ทันทีที่มีการแพ็คของ
              </li>
              <li>
                <strong className="text-amber-400">โหมดคืนสต็อก (Return):</strong> 
                หากลูกค้าเปลี่ยนใจหรือสแกนผิด สามารถสลับโหมดและสแกนสินค้าเพื่อนำยอดกลับเข้าสต็อก +1 ทันที พร้อมระบุเหตุผลได้
              </li>
            </ul>
            <p className="text-xs text-slate-400 mt-2 bg-white/5 p-2 rounded">
              💡 ทิปส์: ด้านล่างจะมีประวัติการเบิกออก สามารถกด "สแกนผิด (ยกเลิก)" เพื่อย้อนกลับการกระทำได้
            </p>
          </div>
        </Card>

        {/* 3. Orders */}
        <Card padding="md" className="border-l-4 border-l-violet-500">
          <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-3">
            <span className="bg-violet-500/20 p-2 rounded-lg">🧾</span> 3. ขายแล้วรอจัดส่ง (Orders)
          </h3>
          <div className="space-y-2 text-sm text-slate-300">
            <ul className="list-disc pl-5 space-y-2">
              <li>ใช้ดูรายการคำสั่งซื้อของลูกค้าที่ถูกบันทึกไว้ในระบบ</li>
              <li>แสดงข้อมูลลูกค้า สถานะออเดอร์ (รอจัดส่ง, ส่งแล้ว) และยอดเงิน</li>
              <li>ระบบจะบันทึกชื่อผู้ที่สร้างออเดอร์กำกับไว้ในแต่ละรายการเสมอ</li>
            </ul>
          </div>
        </Card>

        {/* 4. Stock Take */}
        <Card padding="md" className="border-l-4 border-l-amber-500">
          <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-3">
            <span className="bg-amber-500/20 p-2 rounded-lg">📋</span> 4. นับสต็อก (Stock Take)
          </h3>
          <div className="space-y-2 text-sm text-slate-300">
            <p className="font-medium text-white mb-1">ใช้สำหรับการตรวจนับสินค้าจริง เทียบกับระบบ:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>สแกนบาร์โค้ดสินค้าที่ต้องการนับ ระบบจะแสดงยอดที่มีในระบบปัจจุบันให้เห็น</li>
              <li>กรอก <strong>"จำนวนที่นับได้จริง"</strong> (Physical Count) ลงในช่อง</li>
              <li>หากยอดที่นับได้ ไม่ตรงกับระบบ ระบบจะทำการบันทึกส่วนต่างเป็นรายการปรับยอด (Adjust) ทันที</li>
              <li>แนะนำให้ทำเป็นประจำเพื่อป้องกันของหายหรือสต็อกคลาดเคลื่อน</li>
            </ul>
          </div>
        </Card>

        {/* 5. Putaway */}
        <Card padding="md" className="border-l-4 border-l-cyan-500">
          <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-3">
            <span className="bg-cyan-500/20 p-2 rounded-lg">🗄️</span> 5. สินค้าเหลือส่งคืน (Putaway)
          </h3>
          <div className="space-y-2 text-sm text-slate-300">
            <p className="font-medium text-white mb-1">ใช้สำหรับย้ายสินค้าจากจุดหนึ่ง ไปอีกจุดหนึ่ง หรือนำของเหลือกลับเข้าชั้น:</p>
            <ol className="list-decimal pl-5 space-y-2">
              <li><strong>สแกนสินค้า:</strong> สแกนบาร์โค้ดสินค้าที่ต้องการย้าย</li>
              <li><strong>สแกนพิกัดปลายทาง:</strong> สแกนบาร์โค้ดตำแหน่งที่ต้องการนำไปเก็บ</li>
              <li><strong>ยืนยัน:</strong> ระบุจำนวนชิ้นที่ต้องการย้าย และเลือกเหตุผล (เช่น ย้ายเข้าชั้นวาง) แล้วกดยืนยัน</li>
            </ol>
          </div>
        </Card>
      </div>
    </div>
  )
}
