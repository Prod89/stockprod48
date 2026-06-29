'use client'

import { useRef } from 'react'
import { cn } from '@/lib/utils/cn'

interface CameraCaptureProps {
  onCapture: (file: File) => void
  disabled?: boolean
  className?: string
}

export function CameraCapture({ onCapture, disabled = false, className }: CameraCaptureProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      onCapture(file)
    }
    // Reset input so the same file can be selected again
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  return (
    <div className={cn('space-y-2', className)}>
      <label className="block text-sm font-medium text-white/70">
        <span className="flex items-center gap-2">
          <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          ถ่ายรูปสินค้า
        </span>
      </label>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleCapture}
        disabled={disabled}
        className="hidden"
        id="camera-input"
      />

      <label
        htmlFor="camera-input"
        className={cn(
          'flex flex-col items-center justify-center gap-3 w-full py-8 rounded-xl border-2 border-dashed cursor-pointer transition-all duration-200',
          disabled
            ? 'border-white/5 bg-white/[0.02] cursor-not-allowed opacity-50'
            : 'border-white/10 bg-white/[0.02] hover:border-indigo-500/50 hover:bg-indigo-500/5 active:scale-[0.98]'
        )}
      >
        <div className="w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center">
          <svg className="w-6 h-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-white/70">แตะเพื่อเปิดกล้อง</p>
          <p className="text-xs text-white/40 mt-0.5">ถ่ายรูปสภาพสินค้าและหน้าผ้า</p>
        </div>
      </label>
    </div>
  )
}
