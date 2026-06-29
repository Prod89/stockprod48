'use client'

import { format } from 'date-fns'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'

interface RecentActionsProps {
  title: string
  actions: any[]
}

export function RecentActions({ title, actions }: RecentActionsProps) {
  return (
    <div className="mt-8 space-y-3">
      <h3 className="text-lg font-bold text-white flex items-center gap-2">
        <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        {title}
      </h3>
      
      {actions.length === 0 ? (
        <Card padding="md" className="text-center py-6 text-slate-500">
          ไม่มีประวัติการทำงานล่าสุด
        </Card>
      ) : (
        <Card padding="md" className="space-y-3">
          {actions.map((action: any) => (
            <div key={action.id} className="flex flex-col gap-2 p-3 bg-white/5 rounded-xl border border-white/5">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-white font-medium truncate max-w-[180px]" title={action.products?.name}>
                    {action.products?.name}
                  </p>
                  <p className="text-xs text-indigo-300 font-mono mt-0.5">{action.products?.sku}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-emerald-400">
                    {action.transaction_type === 'OUT' ? '-' : '+'}{action.quantity} ชิ้น
                  </p>
                  {action.locations && (
                    <p className="text-[10px] text-slate-400 mt-0.5">พิกัด: {action.locations.zone_name}</p>
                  )}
                </div>
              </div>
              
              <div className="flex justify-between items-center pt-2 border-t border-white/5">
                <div className="flex items-center gap-1.5 bg-indigo-500/10 px-2 py-1 rounded border border-indigo-500/20">
                  <span className="text-[10px] text-slate-400">ทำรายการโดย:</span>
                  <span className="text-xs font-bold text-indigo-300">{action.profiles?.full_name || 'ไม่ทราบชื่อ'}</span>
                </div>
                <span className="text-[10px] text-slate-500">
                  {format(new Date(action.created_at), 'dd/MM/yy HH:mm')}
                </span>
              </div>
            </div>
          ))}
        </Card>
      )}
    </div>
  )
}
