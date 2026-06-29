'use client'

import { cn } from '@/lib/utils/cn'
import { forwardRef, type SelectHTMLAttributes } from 'react'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: { value: string; label: string }[]
  placeholder?: string
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, placeholder, id, ...props }, ref) => {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={selectId} className="block text-sm font-medium text-white/70">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={cn(
            'w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-base text-white',
            'focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20',
            'transition-all duration-200 min-h-[44px] appearance-none',
            'bg-[url("data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20fill%3D%27none%27%20viewBox%3D%270%200%2024%2024%27%20stroke%3D%27%23ffffff60%27%20stroke-width%3D%272%27%3E%3Cpath%20stroke-linecap%3D%27round%27%20stroke-linejoin%3D%27round%27%20d%3D%27M19%209l-7%207-7-7%27%2F%3E%3C%2Fsvg%3E")] bg-[length:20px] bg-[right_12px_center] bg-no-repeat',
            error && 'border-red-500/50',
            className
          )}
          {...props}
        >
          {placeholder && (
            <option value="" className="bg-slate-900 text-white/50">
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-slate-900 text-white">
              {opt.label}
            </option>
          ))}
        </select>
        {error && (
          <p className="text-sm text-red-400">{error}</p>
        )}
      </div>
    )
  }
)

Select.displayName = 'Select'
export { Select }
export type { SelectProps }
