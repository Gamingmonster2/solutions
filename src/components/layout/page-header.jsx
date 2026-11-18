import { Badge } from '@/components/ui/badge'
import { AnimatedGradientText } from '@/components/magic/animated-gradient-text'
import { BlurFade } from '@/components/magic/blur-fade'
import { cn } from '@/lib/utils'

/**
 * One consistent, spacious hero for every tool. Keeps each domain feeling
 * like the same premium product instead of five separate pages.
 */
export function PageHeader({ eyebrow, title, subtitle, icon: Icon, actions, className }) {
  return (
    <BlurFade className={cn('space-y-4', className)}>
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-3xl space-y-3">
          {eyebrow && (
            <Badge variant="secondary" className="gap-2 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]">
              {Icon && <Icon className="size-3.5 text-primary" />}
              {eyebrow}
            </Badge>
          )}
          <h1 className="text-balance text-3xl font-extrabold leading-[1.1] sm:text-5xl">
            <AnimatedGradientText>{title}</AnimatedGradientText>
          </h1>
          {subtitle && (
            <p className="text-balance max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              {subtitle}
            </p>
          )}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </BlurFade>
  )
}
