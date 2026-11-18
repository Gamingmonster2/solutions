import { ArrowUpRight, Bot, BookOpen, Code2, Globe2, LayoutGrid, MessageSquare, Sparkles } from 'lucide-react'
import { TOOLS } from '@/config/tools'
import { useSettings } from '@/hooks/useSettings'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Spotlight } from '@/components/magic/spotlight'
import { BlurFade } from '@/components/magic/blur-fade'
import { PageHeader } from '@/components/layout/page-header'

const ICONS = { LayoutGrid, MessageSquare, Globe2, Code2, Bot, BookOpen }

export function SolutionsTool({ onOpenTool }) {
  const { t, lang } = useSettings()

  return (
    <div className="mx-auto w-full max-w-6xl space-y-10 pb-10">
      <PageHeader
        eyebrow={t('app.tagline')}
        title={t('solutions.title')}
        subtitle={t('solutions.subtitle')}
        icon={Sparkles}
        actions={
          <Button variant="outline" onClick={() => onOpenTool('guide')}>
            <BookOpen /> {t('nav.guide')}
          </Button>
        }
      />

      <BlurFade delay={0.05}>
        <div className="flex items-start gap-3 rounded-2xl border border-primary/25 bg-accent/50 p-5 backdrop-blur">
          <Sparkles className="mt-0.5 size-5 shrink-0 text-primary" />
          <div className="space-y-1">
            <div className="text-sm font-bold">{t('app.name')}</div>
            <p className="text-sm leading-relaxed text-muted-foreground">{t('solutions.umbrella')}</p>
          </div>
        </div>
      </BlurFade>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {TOOLS.filter((tool) => tool.id !== 'solutions' && tool.id !== 'guide').map((tool, index) => {
          const Icon = ICONS[tool.icon] ?? LayoutGrid
          return (
            <BlurFade key={tool.id} delay={0.06 * index}>
              <Spotlight className="h-full rounded-2xl">
                <Card className="card-premium group h-full p-1">
                  <CardHeader className="pb-3">
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex size-12 items-center justify-center rounded-2xl bg-accent text-accent-foreground transition-transform group-hover:scale-110">
                        <Icon className="size-5" />
                      </div>
                      <Badge variant="outline" className="text-[10px]">{tool.id}</Badge>
                    </div>
                    <CardTitle className="text-xl">{tool.label[lang]}</CardTitle>
                    <CardDescription>{tool.tagline[lang]}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <p className="min-h-12 text-sm leading-relaxed text-muted-foreground">{tool.description[lang]}</p>
                    <Button variant="outline" className="w-full rounded-xl" onClick={() => onOpenTool(tool.id)}>
                      {t('solutions.open')} <ArrowUpRight className={lang === 'ar' ? 'rtl:rotate-180' : ''} />
                    </Button>
                  </CardContent>
                </Card>
              </Spotlight>
            </BlurFade>
          )
        })}
      </div>
    </div>
  )
}
