import { cn } from '@/lib/utils/cn'

interface CardProps {
  children: React.ReactNode
  className?: string
  padding?: 'none' | 'sm' | 'md' | 'lg'
  onClick?: () => void
}

export function Card({ children, className, padding = 'md', onClick }: CardProps) {
  return (
    <div
      className={cn(
        'bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl',
        'shadow-xl shadow-black/20',
        {
          'p-0': padding === 'none',
          'p-3': padding === 'sm',
          'p-4 sm:p-5': padding === 'md',
          'p-5 sm:p-6': padding === 'lg',
        },
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  )
}
