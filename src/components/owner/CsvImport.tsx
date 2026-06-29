'use client'

import { useState } from 'react'
import Papa from 'papaparse'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { bulkImportLedger } from '@/actions/import'

export function CsvImport() {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [preview, setPreview] = useState<any[]>([])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setError(null)
      setSuccess(null)
      
      Papa.parse(e.target.files[0], {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          setPreview(results.data.slice(0, 3)) // Preview first 3 rows
        },
        error: (err) => {
          setError(`Failed to parse CSV: ${err.message}`)
        }
      })
    }
  }

  const handleImport = () => {
    if (!file) return
    setLoading(true)
    setError(null)
    setSuccess(null)

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const formattedEntries = results.data.map((row: any) => ({
            product_id: row.product_id,
            transaction_type: row.transaction_type, // IN, OUT, ADJUST, MOVE
            quantity: parseInt(row.quantity),
            reason_code: row.reason_code || null,
            created_at: row.created_at || new Date().toISOString()
          }))

          const res = await bulkImportLedger(formattedEntries)
          
          if (res.error) throw new Error(res.error)
          
          setSuccess(`นำเข้าข้อมูลสำเร็จ ${formattedEntries.length} รายการ`)
          setFile(null)
          setPreview([])
          const fileInput = document.getElementById('csv-upload') as HTMLInputElement
          if (fileInput) fileInput.value = ''
          
        } catch (err: any) {
          setError(err.message || 'Error importing data')
        } finally {
          setLoading(false)
        }
      }
    })
  }

  return (
    <Card padding="md" className="space-y-4">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        </div>
        <div>
          <h3 className="font-medium text-white">นำเข้าข้อมูลย้อนหลัง (CSV Import)</h3>
          <p className="text-xs text-slate-400 mt-1">
            อัปโหลดไฟล์ CSV เพื่อคีย์ข้อมูลสต็อกย้อนหลังตอนเน็ตล่ม (Offline Recovery)
          </p>
        </div>
      </div>

      <div className="pt-2">
        <input 
          id="csv-upload"
          type="file" 
          accept=".csv"
          onChange={handleFileChange}
          className="block w-full text-sm text-slate-400
            file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0
            file:text-sm file:font-semibold
            file:bg-indigo-500/10 file:text-indigo-400
            hover:file:bg-indigo-500/20 cursor-pointer"
        />
      </div>

      {preview.length > 0 && (
        <div className="bg-slate-900/50 p-3 rounded-xl border border-white/5 space-y-2">
          <p className="text-xs font-bold text-slate-400 mb-2">ตัวอย่างข้อมูล (3 แถวแรก):</p>
          {preview.map((row, i) => (
            <div key={i} className="bg-white/5 p-2.5 rounded-lg flex justify-between items-center text-xs">
              <div className="flex-1 truncate pr-2">
                <span className="text-slate-500">ID:</span> <span className="font-mono text-white truncate inline-block max-w-[80px] align-bottom">{row.product_id}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-500/30 font-bold">{row.transaction_type}</span>
                <span className="font-mono font-bold text-emerald-400">Qty: {row.quantity}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {error && <p className="text-red-400 text-sm">{error}</p>}
      {success && <p className="text-green-400 text-sm">{success}</p>}

      <Button 
        onClick={handleImport}
        disabled={!file || loading}
        isLoading={loading}
        className="w-full"
      >
        ยืนยันการนำเข้า (Import)
      </Button>
    </Card>
  )
}
