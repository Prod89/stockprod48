import { cn } from '@/lib/utils/cn'

interface BadgeProps {
  variant?: 'default' | 'premium' | 'grade1' | 'grade2' | 'grade3' | 'success' | 'warning' | 'error'
  children: React.ReactNode
  className?: string
}

const variantStyles: Record<string, string> = {
  default: 'bg-white/10 text-white/70',
  premium: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  grade1: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  grade2: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  grade3: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  success: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  warning: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  error: 'bg-red-500/20 text-red-300 border-red-500/30',
}

export function Badge({ variant = 'default', children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border border-transparent',
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  )
}
