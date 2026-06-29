'use client'

import { cn } from '@/lib/utils/cn'
import type { ProductGrade } from '@/lib/types/database'

interface GradeSelectorProps {
  value: ProductGrade | null
  onChange: (grade: ProductGrade) => void
  disabled?: boolean
  className?: string
}

const grades: { value: ProductGrade; label: string; color: string; bgColor: string; borderColor: string }[] = [
  {
    value: 'Premium',
    label: 'Premium',
    color: 'text-amber-300',
    bgColor: 'bg-amber-500/20',
    borderColor: 'border-amber-500/50 ring-amber-500/20',
  },
  {
    value: '1',
    label: 'เกรด 1',
    color: 'text-emerald-300',
    bgColor: 'bg-emerald-500/20',
    borderColor: 'border-emerald-500/50 ring-emerald-500/20',
  },
  {
    value: '2',
    label: 'เกรด 2',
    color: 'text-blue-300',
    bgColor: 'bg-blue-500/20',
    borderColor: 'border-blue-500/50 ring-blue-500/20',
  },
  {
    value: '3',
    label: 'เกรด 3',
    color: 'text-orange-300',
    bgColor: 'bg-orange-500/20',
    borderColor: 'border-orange-500/50 ring-orange-500/20',
  },
]

export function GradeSelector({ value, onChange, disabled = false, className }: GradeSelectorProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <label className="block text-sm font-medium text-white/70">
        <span className="flex items-center gap-2">
          <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
          </svg>
          เกรดสินค้า
        </span>
      </label>
      <div className="grid grid-cols-4 gap-2">
        {grades.map((grade) => {
          const isSelected = value === grade.value
          return (
            <button
              key={grade.value}
              type="button"
              disabled={disabled}
              onClick={() => onChange(grade.value)}
              className={cn(
                'relative flex flex-col items-center justify-center py-3 px-2 rounded-xl border-2 transition-all duration-200',
                'active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed min-h-[60px]',
                isSelected
                  ? cn(grade.bgColor, grade.borderColor, 'ring-2 scale-[1.02]')
                  : 'bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10'
              )}
            >
              {isSelected && (
                <div className="absolute -top-1.5 -right-1.5">
                  <div className={cn('w-4 h-4 rounded-full flex items-center justify-center', grade.bgColor, 'border', grade.borderColor.split(' ')[0])}>
                    <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              )}
              <span className={cn(
                'text-sm font-semibold transition-colors',
                isSelected ? grade.color : 'text-white/60'
              )}>
                {grade.label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
