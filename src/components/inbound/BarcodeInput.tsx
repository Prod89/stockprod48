'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import { cn } from '@/lib/utils/cn'

interface BarcodeInputProps {
  onScan: (barcode: string) => void
  value?: string
  onChange?: (value: string) => void
  disabled?: boolean
  placeholder?: string
  className?: string
}

export function BarcodeInput({
  onScan,
  value,
  onChange,
  disabled = false,
  placeholder = 'สแกนบาร์โค้ดหรือพิมพ์ SKU...',
  className,
}: BarcodeInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isFocused, setIsFocused] = useState(false)
  const [lastScan, setLastScan] = useState<string | null>(null)
  const [internalValue, setInternalValue] = useState('')

  const displayValue = value !== undefined ? value : internalValue

  const handleChange = (val: string) => {
    if (onChange) onChange(val)
    if (value === undefined) setInternalValue(val)
  }

  // Auto-focus on mount and when re-enabled
  useEffect(() => {
    if (!disabled && inputRef.current) {
      inputRef.current.focus()
    }
  }, [disabled])

  // Re-focus after a short delay (for barcode scanner workflow)
  const refocus = useCallback(() => {
    setTimeout(() => {
      if (inputRef.current && !disabled) {
        inputRef.current.focus()
        inputRef.current.select()
      }
    }, 100)
  }, [disabled])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      const trimmed = displayValue.trim()
      if (trimmed) {
        setLastScan(trimmed)
        onScan(trimmed)
        if (value === undefined) setInternalValue('')
      }
    }
  }

  return (
    <div className={cn('space-y-2', className)}>
      <label className="block text-sm font-medium text-white/70">
        <span className="flex items-center gap-2">
          <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
          </svg>
          สแกนบาร์โค้ด หรือ พิมพ์ SKU (Manual Lookup)
        </span>
      </label>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={displayValue}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            setIsFocused(false)
            refocus()
          }}
          disabled={disabled}
          placeholder={placeholder}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          className={cn(
            'w-full bg-white/5 border-2 rounded-xl px-4 py-4 text-lg font-mono text-white placeholder:text-white/30',
            'focus:outline-none transition-all duration-200 min-h-[56px]',
            isFocused
              ? 'border-indigo-500 ring-4 ring-indigo-500/20 bg-white/10'
              : 'border-white/10 hover:border-white/20',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        />
        {/* Scanner indicator or Search Button */}
        <div className={cn(
          'absolute right-2 top-1/2 -translate-y-1/2 flex items-center transition-all duration-200',
        )}>
          {displayValue.trim().length > 0 ? (
            <button
              type="button"
              onClick={() => {
                const trimmed = displayValue.trim()
                if (trimmed) {
                  setLastScan(trimmed)
                  onScan(trimmed)
                  if (value === undefined) setInternalValue('')
                  setTimeout(() => {
                    inputRef.current?.focus()
                  }, 50)
                }
              }}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-lg transition-colors"
            >
              ค้นหา
            </button>
          ) : (
            <div className={cn('flex items-center gap-1.5 px-2', isFocused ? 'text-indigo-400' : 'text-white/20')}>
              {isFocused && (
                <span className="text-xs animate-pulse">พร้อมสแกน</span>
              )}
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.75 6.75h.75v.75h-.75v-.75zM6.75 16.5h.75v.75h-.75v-.75zM16.5 6.75h.75v.75h-.75v-.75zM13.5 13.5h.75v.75h-.75v-.75zM13.5 19.5h.75v.75h-.75v-.75zM19.5 13.5h.75v.75h-.75v-.75zM19.5 19.5h.75v.75h-.75v-.75zM16.5 16.5h.75v.75H16.5v-.75z" />
              </svg>
            </div>
          )}
        </div>
      </div>
      {lastScan && (
        <p className="text-xs text-white/40 flex items-center gap-1">
          <svg className="w-3 h-3 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          สแกนล่าสุด: <span className="font-mono text-white/60">{lastScan}</span>
        </p>
      )}
    </div>
  )
}
