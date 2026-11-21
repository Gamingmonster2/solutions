import { useMemo, useState } from 'react'
import { ArrowUpLeft, Clock3, Newspaper } from 'lucide-react'
import { ARTICLES, articlesForLang } from '@/config/articles'
import { useSettings } from '@/hooks/useSettings'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { GlassShine } from '@/components/magic/glass-shine'
import { BlurFade } from '@/components/magic/blur-fade'
import { PageHeader } from '@/components/layout/page-header'

const FILTERS = [
  { id: 'current', labelKey: 'articles.filter.current' },
  { id: 'ar', labelKey: 'articles.filter.ar' },
  { id: 'en', labelKey: 'articles.filter.en' },
  { id: 'all', labelKey: 'articles.filter.all' },
]

function formatDate(date, lang) {
  return new Intl.DateTimeFormat(lang === 'ar' ? 'ar-LY' : 'en-GB', {
    year: 'numeric', month: 'long', day: 'numeric',
  }).format(new Date(`${date}T00:00:00Z`))
}

// eslint-disable-next-line no-unused-vars -- `Icon` is rendered as JSX below.
function Meta({ article, lang, t, icon: Icon = Clock3 }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <Icon className="size-3.5" />
      {t('articles.minRead', { count: article.readMinutes })}
    </span>
  )
}

export function ArticlesTool() {
  const { t, lang } = useSettings()
  const [filter, setFilter] = useState('current')
  const [selected, setSelected] = useState(null)

  const visible = useMemo(() => {
    if (filter === 'ar' || filter === 'en') return articlesForLang(filter)
    if (filter === 'all') return ARTICLES
    return articlesForLang(lang)
  }, [filter, lang])

  const featured = visible[0]
  const rest = visible.slice(1)

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 pb-10">
      <PageHeader
        eyebrow={t('articles.eyebrow')}
        title={t('articles.title')}
        subtitle={t('articles.subtitle')}
        icon={Newspaper}
      />

      <BlurFade delay={0.04}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-nowrap gap-1.5 overflow-x-auto rounded-2xl border border-border/70 bg-background/60 p-1.5 shadow-sm scrollbar-thin">
            {FILTERS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setFilter(item.id)}
                aria-pressed={filter === item.id}
                className={
                  filter === item.id
                    ? 'shrink-0 rounded-xl bg-background px-3.5 py-2 text-xs font-semibold text-foreground shadow-sm transition-all sm:text-sm'
                    : 'shrink-0 rounded-xl px-3.5 py-2 text-xs font-semibold text-muted-foreground transition-all hover:bg-accent hover:text-accent-foreground sm:text-sm'
                }
              >
                {t(item.labelKey)}
              </button>
            ))}
          </div>
          <span className="text-xs font-medium text-muted-foreground">
            {t('articles.count', { count: visible.length })}
          </span>
        </div>
      </BlurFade>

      {featured && (
        <BlurFade delay={0.08}>
          <button type="button" onClick={() => setSelected(featured)} className="block w-full text-start">
            <GlassShine
              image={featured.image}
              alt={featured.imageAlt[lang]}
              eyebrow={`${t('articles.featured')} · ${featured.category[lang]}`}
              title={featured.title}
              priority
              beam
            >
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                <Meta article={featured} lang={lang} t={t} />
                <span className="inline-flex items-center gap-1.5 font-semibold">
                  {t('articles.read')}
                  <ArrowUpLeft className="size-3.5 rtl:rotate-90" />
                </span>
              </div>
            </GlassShine>
          </button>
        </BlurFade>
      )}

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {rest.map((article, index) => (
          <BlurFade key={article.id} delay={0.05 * index}>
            <button type="button" onClick={() => setSelected(article)} className="block w-full text-start">
              <GlassShine
                image={article.image}
                alt={article.imageAlt[lang]}
                eyebrow={article.category[lang]}
                title={article.title}
              >
                <div className="flex items-center justify-between gap-3">
                  <Meta article={article} lang={lang} t={t} />
                  <ArrowUpLeft className="size-4 shrink-0 rtl:rotate-90" />
                </div>
              </GlassShine>
            </button>
          </BlurFade>
        ))}
      </div>

      <Dialog open={selected !== null} onOpenChange={(open) => { if (!open) setSelected(null) }}>
        <DialogContent className="max-h-[90dvh] w-[calc(100%-1.5rem)] max-w-2xl overflow-y-auto p-0 sm:p-0">
          {selected && (
            <article>
              <img
                src={selected.image}
                alt={selected.imageAlt[lang]}
                className="aspect-[16/9] w-full object-cover"
              />
              <div className="space-y-5 p-5 sm:p-7">
                <DialogHeader>
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <Badge variant="secondary" className="rounded-full text-[10px] uppercase tracking-wider">
                      {selected.category[lang]}
                    </Badge>
                    <Meta article={selected} lang={lang} t={t} icon={Clock3} />
                  </div>
                  <DialogTitle className="font-display text-2xl leading-snug sm:text-3xl">
                    {selected.title}
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground">
                    {formatDate(selected.date, lang)}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 text-sm leading-[1.9] text-foreground/85 sm:text-[15px]">
                  {selected.body.map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                  ))}
                </div>
                <Button variant="outline" className="w-full rounded-xl" onClick={() => setSelected(null)}>
                  {t('articles.close')}
                </Button>
              </div>
            </article>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
