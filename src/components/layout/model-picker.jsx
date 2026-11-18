import { Cpu, KeyRound, Sparkles } from 'lucide-react'
import { orderedModels } from '@/config/models'
import { useAI } from '@/hooks/useAI'
import { useSettings } from '@/hooks/useSettings'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select'

export function ModelPicker() {
  const { model, modelId, setModelId, hasKeyFor, hasKey } = useAI()
  const { t, lang } = useSettings()
  const models = orderedModels()

  const groups = [
    { lane: 'shared', label: t('header.sharedPool'), icon: Sparkles },
    { lane: 'byok', label: t('header.yourKey'), icon: KeyRound },
  ]

  return (
    <div className="flex items-center gap-2">
      <Cpu className="size-4 text-primary max-sm:hidden" />
      <Select value={modelId} onValueChange={setModelId}>
        <SelectTrigger
          className="w-[210px] rounded-xl border-border/80 bg-background/70 shadow-sm backdrop-blur max-sm:w-[150px]"
          aria-label={t('header.model')}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="rounded-2xl">
          {groups.map((group) => {
            const laneModels = models.filter((item) => item.lane === group.lane)
            if (!laneModels.length) return null
            return (
              <SelectGroup key={group.lane}>
                <SelectLabel className="flex items-center gap-1.5 px-3 py-2 text-[10px] uppercase tracking-[0.14em]">
                  <group.icon className="size-3" /> {group.label}
                </SelectLabel>
                {laneModels.map((item) => {
                  const locked = group.lane === 'byok' && !hasKeyFor(item.provider)
                  return (
                    <SelectItem key={item.id} value={item.id} disabled={locked} className="rounded-xl py-2">
                      <span className="flex w-full items-center justify-between gap-3">
                        <span className="truncate">{item.label}</span>
                        <span className="shrink-0 text-[10px] font-semibold text-muted-foreground">
                          {item.lane === 'shared' ? `${item.creditCost} cr` : locked ? '🔒' : 'BYOK'}
                        </span>
                      </span>
                    </SelectItem>
                  )
                })}
              </SelectGroup>
            )
          })}
        </SelectContent>
      </Select>
      <Badge
        variant={model.lane === 'shared' ? 'default' : 'secondary'}
        className="hidden rounded-full px-2.5 text-[10px] lg:inline-flex"
      >
        {model.lane === 'shared' ? t('header.free') : hasKey ? t('header.byok') : t('header.addKey')}
      </Badge>
      <span className="hidden max-w-[220px] text-xs leading-snug text-muted-foreground 2xl:inline">
        {lang === 'ar' ? model.noteAr : model.note}
      </span>
    </div>
  )
}
