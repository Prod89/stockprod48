'use client'

import { cn } from '@/lib/utils/cn'
import { forwardRef, type ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          'relative inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100',
          {
            'bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:brightness-110': variant === 'primary',
            'bg-white/10 text-white border border-white/10 hover:bg-white/15 backdrop-blur-sm': variant === 'secondary',
            'text-white/70 hover:text-white hover:bg-white/5': variant === 'ghost',
            'bg-red-500/20 text-red-400 border border-red-500/20 hover:bg-red-500/30': variant === 'danger',
          },
          {
            'px-3 py-1.5 text-sm min-h-[36px]': size === 'sm',
            'px-4 py-2.5 text-sm min-h-[44px]': size === 'md',
            'px-6 py-3 text-base min-h-[52px]': size === 'lg',
          },
          className
        )}
        {...props}
      >
        {isLoading ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            กำลังดำเนินการ...
          </>
        ) : (
          children
        )}
      </button>
    )
  }
)

Button.displayName = 'Button'
export { Button }
export type { ButtonProps }
