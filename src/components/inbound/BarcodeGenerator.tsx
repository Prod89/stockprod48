'use client'

import { useRef, useState } from 'react'
// @ts-ignore
import Barcode from 'react-barcode'
import { Button } from '../ui/Button'
import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas'

interface Props {
  sku: string
  name: string
  onClose: () => void
}

export function BarcodeGenerator({ sku, name, onClose }: Props) {
  const printAreaRef = useRef<HTMLDivElement>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  const handleDownloadPDF = async () => {
    if (!printAreaRef.current) return
    setIsGenerating(true)

    try {
      // Capture the element
      const canvas = await html2canvas(printAreaRef.current, {
        scale: 4, // High resolution
        useCORS: true,
        backgroundColor: '#ffffff'
      })
      
      const imgData = canvas.toDataURL('image/png')
      
      // Create PDF sized 30x20 mm (3x2 cm)
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: [30, 20]
      })

      pdf.addImage(imgData, 'PNG', 0, 0, 30, 20)
      pdf.save(`barcode-${sku}.pdf`)
    } catch (error) {
      console.error('Failed to generate PDF', error)
      alert('เกิดข้อผิดพลาดในการสร้าง PDF')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm flex flex-col items-center shadow-2xl">
        
        <h3 className="text-black font-bold mb-4">ตัวอย่างฉลาก (30x20mm)</h3>
        
        {/* Printable Area (Scaled up for viewing, but exact ratio) */}
        <div 
          className="bg-slate-100 p-4 rounded-xl flex items-center justify-center w-full overflow-hidden"
        >
          <div 
            ref={printAreaRef}
            id="print-area" 
            className="flex flex-col items-center justify-center bg-white text-black text-center"
            style={{ width: '300px', height: '200px', padding: '10px' }} // Using 10x scale for high quality capture
          >
            <p className="font-bold line-clamp-2 leading-tight" style={{ fontSize: '18px', marginBottom: '8px' }}>
              {name}
            </p>
            <Barcode 
              value={sku} 
              width={2} 
              height={70} 
              fontSize={18}
              background="#ffffff"
              lineColor="#000000"
              margin={0}
            />
          </div>
        </div>

        <p className="text-sm text-slate-500 mt-4 text-center">
          ระบบจะดาวน์โหลดไฟล์ PDF ขนาด 3x2 cm เพื่อให้คุณเปิดผ่านแอป Label Printer ได้ทันที
        </p>

        <div className="flex gap-3 w-full mt-6">
          <Button variant="ghost" onClick={onClose} className="flex-1 text-slate-500 border border-slate-200">
            ปิด
          </Button>
          <Button 
            onClick={handleDownloadPDF} 
            isLoading={isGenerating}
            className="flex-[2] bg-indigo-600 hover:bg-indigo-700"
          >
            ดาวน์โหลด PDF Label
          </Button>
        </div>
      </div>
    </div>
  )
}
