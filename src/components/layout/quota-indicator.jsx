import { Gauge } from 'lucide-react'
import { useAI } from '@/hooks/useAI'
import { useSettings } from '@/hooks/useSettings'
import { cn } from '@/lib/utils'

export function QuotaIndicator() {
  const { used, limit } = useAI()
  const { t } = useSettings()
  const remaining = Math.max(0, limit - used)

  return (
    <div
      className={cn(
        'hidden items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs shadow-sm lg:flex',
        remaining === 0 && 'border-destructive text-destructive',
      )}
      title={`${t('quota.reset')} — ${t('quota.local')}`}
    >
      <Gauge className="size-3.5 text-primary" />
      <span>{t('quota.used', { used, limit })}</span>
    </div>
  )
}
