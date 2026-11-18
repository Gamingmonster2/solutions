import {
  ArrowUpRight, BookOpen, CheckCircle2, Coins, CreditCard, ExternalLink,
  Gauge, KeyRound, LockKeyhole, Scale, Server, ShieldCheck, Sparkles, XCircle,
} from 'lucide-react'
import { PROVIDER_NOTES, PROVIDERS } from '@/config/providers'
import { orderedModels } from '@/config/models'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card'
import { BlurFade } from '@/components/magic/blur-fade'
import { BorderBeam } from '@/components/magic/border-beam'
import { PageHeader } from '@/components/layout/page-header'
import { useSettings } from '@/hooks/useSettings'

// eslint-disable-next-line no-unused-vars -- `Icon` is rendered as JSX below.
function Section({ icon: Icon, title, children, delay = 0 }) {
  return (
    <BlurFade delay={delay}>
      <Card className="card-premium h-full">
        <CardHeader className="pb-4">
          <div className="mb-1 flex size-10 items-center justify-center rounded-xl bg-accent text-accent-foreground">
            <Icon className="size-5" />
          </div>
          <h2 className="font-display text-xl font-bold tracking-tight">{title}</h2>
        </CardHeader>
        <CardContent className="space-y-3 text-sm leading-relaxed text-muted-foreground">
          {children}
        </CardContent>
      </Card>
    </BlurFade>
  )
}

function Steps({ keys }) {
  return (
    <ol className="space-y-2">
      {keys.map((key, index) => (
        <li key={key} className="flex gap-3 rounded-xl border border-border bg-background/60 p-3">
          <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
            {index + 1}
          </span>
          <span>{key}</span>
        </li>
      ))}
    </ol>
  )
}

function StatusBadge({ status, training }) {
  const { t } = useSettings()
  const active = status === 'active'
  return (
    <div className="flex flex-wrap gap-1.5">
      <Badge variant={active ? 'default' : 'secondary'} className="text-[10px]">
        {active ? t('guide.statusActive') : t('guide.statusOff')}
      </Badge>
      <Badge
        variant={training === false ? 'outline' : 'secondary'}
        className={training === true ? 'border-destructive/30 bg-destructive/10 text-destructive' : 'text-[10px]'}
      >
        {training === false
          ? t('guide.trainingNo')
          : training === 'optional'
            ? t('guide.trainingOptional')
            : t('guide.trainingYes')}
      </Badge>
    </div>
  )
}

export function GuideTool() {
  const { t, lang } = useSettings()
  const models = orderedModels().slice(0, 10)

  return (
    <div className="mx-auto w-full max-w-6xl space-y-10 pb-10">
      <PageHeader
        eyebrow={t('guide.eyebrow')}
        title={t('guide.title')}
        subtitle={t('guide.subtitle')}
        icon={BookOpen}
      />

      <BlurFade delay={0.05}>
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="card-premium">
            <CardHeader>
              <div className="mb-1 flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Server className="size-5" />
              </div>
              <h2 className="font-display text-xl font-bold tracking-tight">{t('guide.sharedTitle')}</h2>
              <CardDescription>{t('header.sharedPool')}</CardDescription>
            </CardHeader>
            <CardContent className="text-sm leading-relaxed text-muted-foreground">
              {t('guide.sharedText')}
            </CardContent>
          </Card>

          <Card className="card-premium">
            <CardHeader>
              <div className="mb-1 flex size-10 items-center justify-center rounded-xl bg-chart-4/10 text-chart-4">
                <KeyRound className="size-5" />
              </div>
              <h2 className="font-display text-xl font-bold tracking-tight">{t('guide.byokTitle')}</h2>
              <CardDescription>{t('header.yourKey')}</CardDescription>
            </CardHeader>
            <CardContent className="text-sm leading-relaxed text-muted-foreground">
              {t('guide.byokText')}
            </CardContent>
          </Card>
        </div>
      </BlurFade>

      <BlurFade delay={0.1}>
        <div className="grid gap-4 md:grid-cols-3">
          <Section icon={Gauge} title={t('guide.quotaTitle')} delay={0}>
            <p>{t('guide.quotaText')}</p>
          </Section>
          <Section icon={Scale} title={t('guide.fairTitle')} delay={0.05}>
            <ul className="space-y-2">
              {['fair1', 'fair2', 'fair3', 'fair4', 'fair5'].map((key) => (
                <li key={key} className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                  <span>{t(`guide.${key}`)}</span>
                </li>
              ))}
            </ul>
          </Section>
          <Section icon={LockKeyhole} title={t('guide.browserTitle')} delay={0.1}>
            <p>{t('guide.browserText')}</p>
          </Section>
        </div>
      </BlurFade>

      <BlurFade delay={0.15}>
        <div className="rounded-3xl p-1">
          <BorderBeam>
            <Card className="card-premium border-primary/30">
              <CardHeader>
                <div className="mb-1 flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                  <Coins className="size-5" />
                </div>
                <h2 className="font-display text-2xl font-bold tracking-tight">{t('guide.costTitle')}</h2>
              </CardHeader>
              <CardContent className="space-y-3 text-sm leading-relaxed text-muted-foreground">
                <p className="text-base text-foreground">{t('guide.costText')}</p>
                <p>{t('guide.costNote')}</p>
              </CardContent>
            </Card>
          </BorderBeam>
        </div>
      </BlurFade>

      <BlurFade delay={0.2}>
        <Card className="card-premium overflow-hidden">
          <CardHeader>
            <h2 className="font-display text-2xl font-bold tracking-tight">{t('guide.providersTitle')}</h2>
            <CardDescription>{t('guide.providersText')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {PROVIDER_NOTES.map((item) => (
              <div key={item.id} className="rounded-2xl border border-border bg-background/60 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="font-bold text-foreground">{item.name}</div>
                    <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
                      {lang === 'ar' ? item.noteAr : item.note}
                    </p>
                  </div>
                  <StatusBadge status={item.status} training={item.training} />
                </div>
                <Button variant="link" size="sm" className="mt-2 px-0" asChild>
                  <a href={item.url} target="_blank" rel="noreferrer">
                    {t('guide.source')} <ArrowUpRight className={lang === 'ar' ? 'rtl:rotate-180' : ''} />
                  </a>
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </BlurFade>

      <BlurFade delay={0.25}>
        <Card className="card-premium">
          <CardHeader>
            <h2 className="font-display text-2xl font-bold tracking-tight">{t('guide.title')}</h2>
            <CardDescription>{t('guide.lanesText')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full min-w-[640px] text-start text-sm">
                <thead>
                  <tr className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="px-3 py-3 text-start">{t('header.model')}</th>
                    <th className="px-3 py-3 text-start">{t('header.sharedPool')}</th>
                    <th className="px-3 py-3 text-start">{t('nav.guide')}</th>
                  </tr>
                </thead>
                <tbody>
                  {models.map((model) => (
                    <tr key={model.id} className="border-b border-border/70 last:border-0">
                      <td className="px-3 py-3">
                        <div className="font-semibold text-foreground">{model.label}</div>
                        <div dir="ltr" className="text-[11px] text-muted-foreground">{model.id}</div>
                      </td>
                      <td className="px-3 py-3">
                        <Badge variant={model.lane === 'shared' ? 'default' : 'outline'} className="text-[10px]">
                          {model.lane === 'shared' ? model.badge : t('header.yourKey')}
                        </Badge>
                      </td>
                      <td className="px-3 py-3 text-muted-foreground">
                        {model.lane === 'shared'
                          ? t('guide.quotaText')
                          : t('guide.keyText')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </BlurFade>

      <div className="grid gap-4 lg:grid-cols-2">
        <Section icon={KeyRound} title={t('guide.keyTitle')} delay={0.3}>
          <p>{t('guide.keyText')}</p>
          <div className="space-y-4 pt-2">
            <div>
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="font-bold text-foreground">{PROVIDERS.groq.label}</span>
                <Button variant="link" size="sm" className="px-0" asChild>
                  <a href={PROVIDERS.groq.keyUrl} target="_blank" rel="noreferrer">
                    {t('header.getGroqKey')} <ExternalLink />
                  </a>
                </Button>
              </div>
              <Steps keys={[t('guide.groq1'), t('guide.groq2'), t('guide.groq3')]} />
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="font-bold text-foreground">{PROVIDERS.openrouter.label}</span>
                <Button variant="link" size="sm" className="px-0" asChild>
                  <a href={PROVIDERS.openrouter.keyUrl} target="_blank" rel="noreferrer">
                    {t('header.getOpenRouterKey')} <ExternalLink />
                  </a>
                </Button>
              </div>
              <Steps keys={[t('guide.or1'), t('guide.or2'), t('guide.or3')]} />
            </div>
          </div>
        </Section>

        <div className="space-y-4">
          <Section icon={ShieldCheck} title={t('guide.dataTitle')} delay={0.35}>
            <p>{t('guide.dataText')}</p>
            <div className="space-y-2 pt-1">
              <div className="flex items-start gap-2 rounded-xl bg-secondary/70 p-3">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                <span>{t('guide.dataOff')}</span>
              </div>
              <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3">
                <XCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
                <span>{t('guide.dataOn')}</span>
              </div>
            </div>
            <Button variant="link" size="sm" className="px-0" asChild>
              <a href={PROVIDERS.openrouter.docsUrl} target="_blank" rel="noreferrer">
                {t('guide.learnMore')} <ArrowUpRight className={lang === 'ar' ? 'rtl:rotate-180' : ''} />
              </a>
            </Button>
          </Section>

          <Section icon={CreditCard} title={t('guide.paymentTitle')} delay={0.4}>
            <p>{t('guide.authText')}</p>
            <p>{t('guide.paymentText')}</p>
          </Section>
        </div>
      </div>

      <BlurFade delay={0.45}>
        <Card className="card-premium bg-gradient-to-br from-primary/10 via-transparent to-chart-4/10">
          <CardContent className="flex flex-col gap-4 p-8 text-center sm:flex-row sm:items-center sm:justify-between sm:text-start">
            <div className="space-y-1">
              <div className="flex items-center justify-center gap-2 sm:justify-start">
                <Sparkles className="size-5 text-primary" />
                <h2 className="text-xl font-bold">{t('guide.ctaTitle')}</h2>
              </div>
              <p className="text-sm text-muted-foreground">{t('guide.ctaText')}</p>
            </div>
            <Button size="lg" asChild>
              <a href={PROVIDERS.groq.keyUrl} target="_blank" rel="noreferrer">
                {t('header.addKey')} <ArrowUpRight className={lang === 'ar' ? 'rtl:rotate-180' : ''} />
              </a>
            </Button>
          </CardContent>
        </Card>
      </BlurFade>
    </div>
  )
}
