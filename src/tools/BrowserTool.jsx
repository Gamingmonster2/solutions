import { useState } from 'react'
import { ArrowLeft, BookOpen, ExternalLink, Globe2, Landmark, Loader2, Search, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAI } from '@/hooks/useAI'
import { useSettings } from '@/hooks/useSettings'
import { browse, summarizeSource } from '@/services/web'
import { renderMarkdown } from '@/lib/markdown'
import { BlurFade } from '@/components/magic/blur-fade'
import { PageHeader } from '@/components/layout/page-header'
import { cn } from '@/lib/utils'

const WIKI_LANGS = [
  { value: 'en', label: 'English' },
  { value: 'ar', label: 'العربية' },
  { value: 'fr', label: 'Français' },
  { value: 'es', label: 'Español' },
  { value: 'de', label: 'Deutsch' },
]

const SOURCE_ICONS = { wikipedia: BookOpen, archive: Landmark, wayback: Globe2 }

export function BrowserTool() {
  const { t, lang: uiLang } = useSettings()
  const { run } = useAI()

  const [query, setQuery] = useState('')
  const [wikiLang, setWikiLang] = useState(uiLang === 'ar' ? 'ar' : 'en')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState(null)
  const [sourceText, setSourceText] = useState('')
  const [summary, setSummary] = useState('')
  const [summarizing, setSummarizing] = useState(false)

  async function handleSearch(event) {
    event?.preventDefault()
    const term = query.trim()
    if (!term) return

    setLoading(true)
    setSelected(null)
    setSummary('')
    try {
      const found = await browse({ query: term, lang: wikiLang })
      setResults(found)
      if (!found.length) toast.info(t('browser.noResults'))
    } catch (error) {
      toast.error(error.message || t('common.error'))
    } finally {
      setLoading(false)
    }
  }

  async function openResult(item) {
    setSelected(item)
    setSummary('')
    setSourceText('')
    try {
      setSourceText(await summarizeSource(item, wikiLang))
    } catch {
      setSourceText(item.snippet)
    }
  }

  async function handleSummarize() {
    const text = sourceText || selected?.snippet
    if (!text) return
    setSummarizing(true)
    try {
      const result = await run({
        messages: [
          {
            role: 'system',
            content: `Summarize the following web source clearly and neutrally in ${uiLang === 'ar' ? 'Arabic' : 'English'}. Use short Markdown bullets. Do not invent facts that are not in the source.`,
          },
          { role: 'user', content: `SOURCE TITLE: ${selected?.title}\n\nSOURCE TEXT:\n${text}` },
        ],
        maxTokens: 1024,
      })
      setSummary(result.text)
    } catch (error) {
      toast.error(error.message || t('common.error'))
    } finally {
      setSummarizing(false)
    }
  }

  function reset() {
    setSelected(null)
    setSummary('')
    setSourceText('')
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8 pb-10">
      <PageHeader
        eyebrow={t('nav.tools')}
        title={t('browser.title')}
        subtitle={t('browser.subtitle')}
        icon={Globe2}
      />

      <BlurFade delay={0.05}>
      <form onSubmit={handleSearch} className="flex flex-wrap items-end gap-3 rounded-2xl border border-border/80 bg-card/90 p-4 shadow-soft backdrop-blur">
        <div className="min-w-[220px] flex-1 space-y-1.5">
          <Label htmlFor="browser-query">{t('browser.placeholder')}</Label>
          <Input
            id="browser-query"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('browser.placeholder')}
            dir="auto"
          />
        </div>
        <div className="w-36 space-y-1.5">
          <Label htmlFor="wiki-lang">{t('browser.langHint')}</Label>
          <Select value={wikiLang} onValueChange={setWikiLang}>
            <SelectTrigger id="wiki-lang"><SelectValue /></SelectTrigger>
            <SelectContent>
              {WIKI_LANGS.map((item) => (
                <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button type="submit" disabled={loading || !query.trim()}>
          {loading ? <Loader2 className="animate-spin" /> : <Search />} {loading ? t('browser.searching') : t('browser.search')}
        </Button>
      </form>
      </BlurFade>

      <p className="text-center text-xs text-muted-foreground">{t('browser.powered')}</p>

      {selected ? (
        <div className="space-y-4">
          <Button variant="ghost" size="sm" onClick={reset}>
            <ArrowLeft className="rtl:rotate-180" /> {t('browser.back')}
          </Button>

          <Card>
            <CardHeader>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Badge variant="secondary">{t(`browser.${selected.source === 'archive' ? 'archive' : selected.source === 'wayback' ? 'wayback' : 'wikipedia'}`)}</Badge>
                {selected.timestamp && <Badge variant="outline">{t('browser.snapshot')}</Badge>}
              </div>
              <CardTitle className="break-words">{selected.title}</CardTitle>
              <CardDescription className="break-words">{selected.snippet}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="outline" size="sm" asChild>
                <a href={selected.url} target="_blank" rel="noreferrer">
                  {selected.source === 'wikipedia' ? t('browser.readMore') : t('browser.openArchive')}
                  <ExternalLink />
                </a>
              </Button>

              <div className="rounded-lg bg-muted p-4 text-sm leading-relaxed">
                {sourceText || t('common.loading')}
              </div>

              <div className="space-y-2">
                <Button variant="default" size="sm" onClick={handleSummarize} disabled={summarizing || !sourceText}>
                  {summarizing ? <Loader2 className="animate-spin" /> : <Sparkles />}
                  {summarizing ? t('browser.summarizing') : t('browser.summarize')}
                </Button>
                {summary && (
                  <div className={cn('rounded-lg border border-primary/30 bg-accent/40 p-4 text-sm leading-relaxed')}>
                    <div className="mb-2 text-xs font-bold uppercase text-primary">{t('browser.summaryReady')}</div>
                    <div dangerouslySetInnerHTML={{ __html: renderMarkdown(summary) }} />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">{t('browser.results')}</h2>
          {results.map((item) => {
            const Icon = SOURCE_ICONS[item.source] ?? Globe2
            return (
              <Card
                key={item.id}
                className="cursor-pointer transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-lg"
                onClick={() => openResult(item)}
              >
                <CardContent className="flex gap-3 p-4">
                  <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                    <Icon className="size-4" />
                  </div>
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold">{item.title}</span>
                      <Badge variant="outline" className="text-[10px]">
                        {t(`browser.${item.source === 'archive' ? 'archive' : item.source === 'wayback' ? 'wayback' : 'wikipedia'}`)}
                      </Badge>
                    </div>
                    <p className="line-clamp-2 text-sm text-muted-foreground">{item.snippet}</p>
                  </div>
                </CardContent>
              </Card>
            )
          })}
          {!results.length && !loading && (
            <div className="rounded-xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
              {t('browser.noResults')}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
