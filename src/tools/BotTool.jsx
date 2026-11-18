import { useState } from 'react'
import {
  Check, Code2, Copy, Download, ExternalLink, Image as ImageIcon, Loader2,
  Monitor, Search, Smartphone, Sparkles, Tablet, X,
} from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { useAI } from '@/hooks/useAI'
import { useSettings } from '@/hooks/useSettings'
import { searchPixabay, visualInstructions } from '@/services/images'
import { cn } from '@/lib/utils'
import { BlurFade } from '@/components/magic/blur-fade'
import { PageHeader } from '@/components/layout/page-header'

const DEVICES = [
  { id: 'desktop', icon: Monitor, width: '100%' },
  { id: 'tablet', icon: Tablet, width: '768px' },
  { id: 'mobile', icon: Smartphone, width: '390px' },
]

function systemPrompt({ visualMode, selectedImages, hasPixabay, refine, code }) {
  const base = `You are a World-Class Senior Frontend Engineer and UI/UX Designer.
Generate a SINGLE, COMPLETE, SELF-CONTAINED HTML file based on the user's description.

TECHNICAL REQUIREMENTS:
1. Use modern, professional, responsive design with Tailwind CSS via CDN.
2. Build a polished single-page structure with a minimalist, high-end look.
3. Use clean semantic HTML5 and small, optimized JavaScript.
4. Use Font Awesome via CDN for icons and Google Fonts for typography.
5. Keep all CSS in <style> and all JS in <script>. Add smooth scrolling and subtle reveal animations.
6. Be mobile-first and fully responsive.
7. Return ONLY raw HTML starting exactly with <!DOCTYPE html>. No markdown fences, no explanation.`

  const refinement = refine && code
    ? `[OPTIMIZATION BOX] The user wants to refine the existing design. Read the CURRENT HTML CODE and the NEW REQUEST carefully. Change only the requested sections while preserving the rest of the structure and styling. Replace old image URLs cleanly when new ones are supplied.

CURRENT HTML CODE:
${code}`
    : ''

  return `${base}\n\n${visualInstructions(selectedImages, hasPixabay, visualMode)}\n\n${refinement}`
}

function userPrompt({ prompt, selectedImages, visualMode, hasPixabay }) {
  if (!visualMode || !hasPixabay || !selectedImages.length) return prompt
  const assets = selectedImages
    .map((image) => `- URL: ${image.url} | Tags: ${image.tags} | Aspect Ratio: ${image.aspectRatio ?? 1}`)
    .join('\n')
  return `${prompt}\n\n[MANDATORY VISUAL ASSETS] Use these exact image URLs in the HTML:\n${assets}`
}

function cleanHtml(text) {
  let output = String(text ?? '').trim()
  output = output.replace(/^```(?:html)?\s*/i, '').replace(/```\s*$/i, '').trim()
  const match = output.match(/<!DOCTYPE html>[\s\S]*<\/html>/i)
  return match ? match[0] : output
}

export function BotTool() {
  const { t, lang } = useSettings()
  const { run, pixabayKey } = useAI()

  const [prompt, setPrompt] = useState('')
  const [refine, setRefine] = useState(false)
  const [visualMode, setVisualMode] = useState(false)
  const [imageQuery, setImageQuery] = useState('')
  const [images, setImages] = useState([])
  const [selectedImages, setSelectedImages] = useState([])
  const [imageLoading, setImageLoading] = useState(false)
  const [code, setCode] = useState('')
  const [building, setBuilding] = useState(false)
  const [view, setView] = useState('preview')
  const [device, setDevice] = useState('desktop')
  const [copied, setCopied] = useState(false)

  async function handleImageSearch() {
    const query = imageQuery.trim() || prompt.trim().split(/\s+/).slice(0, 3).join(' ')
    if (!query) return toast.info(t('bot.imageSearch'))
    if (!pixabayKey) return toast.info(t('bot.needImageKey'))

    setImageLoading(true)
    try {
      setImages(await searchPixabay(query, pixabayKey))
    } catch (error) {
      toast.error(error.message)
    } finally {
      setImageLoading(false)
    }
  }

  function toggleImageSelection(image) {
    setSelectedImages((previous) =>
      previous.some((item) => item.id === image.id)
        ? previous.filter((item) => item.id !== image.id)
        : [...previous, image],
    )
  }

  async function build() {
    const text = prompt.trim()
    if (!text) return toast.error(t('common.enterPrompt'))
    if (refine && !code) {
      toast.info(t('bot.noCode'))
      setRefine(false)
      return
    }

    setBuilding(true)
    try {
      const result = await run({
        messages: [
          {
            role: 'system',
            content: systemPrompt({
              visualMode, selectedImages, hasPixabay: Boolean(pixabayKey), refine, code,
            }),
          },
          {
            role: 'user',
            content: userPrompt({ prompt: text, selectedImages, visualMode, hasPixabay: Boolean(pixabayKey) }),
          },
        ],
        maxTokens: 5000,
      })
      setCode(cleanHtml(result.text))
      setView('preview')
      setRefine(false)
      toast.success(t('bot.generated'))
    } catch (error) {
      toast.error(error.message || t('common.error'))
    } finally {
      setBuilding(false)
    }
  }

  async function copyCode() {
    if (!code) return toast.info(t('bot.noCode'))
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
      toast.success(t('common.copied'))
    } catch {
      toast.error(t('common.error'))
    }
  }

  function download() {
    if (!code) return toast.info(t('bot.noCode'))
    const url = URL.createObjectURL(new Blob([code], { type: 'text/html;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url
    link.download = 'generated-website.html'
    link.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  function openTab() {
    if (!code) return toast.info(t('bot.noCode'))
    const url = URL.createObjectURL(new Blob([code], { type: 'text/html;charset=utf-8' }))
    window.open(url, '_blank', 'noopener')
    setTimeout(() => URL.revokeObjectURL(url), 60000)
  }

  const activeDevice = DEVICES.find((item) => item.id === device)

  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-8 pb-10">
      <PageHeader
        eyebrow={t('nav.tools')}
        title={t('bot.builderTitle')}
        subtitle={t('bot.subtitleFull')}
        icon={Sparkles}
      />

      <div className="grid gap-5 lg:grid-cols-[380px_minmax(0,1fr)]">
        <BlurFade delay={0.05}>
        <Card className="card-premium h-fit">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="size-4 text-primary" /> {t('bot.builderTitle')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="bot-prompt">{t('bot.optimizeBox')}</Label>
              <Textarea
                id="bot-prompt"
                rows={7}
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                placeholder={t('bot.promptPlaceholder')}
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div className="flex items-center gap-2">
                <ImageIcon className="size-4 text-primary" />
                <div>
                  <Label htmlFor="visual-mode" className="cursor-pointer">{t('bot.visualMode')}</Label>
                  {!pixabayKey && <p className="text-[11px] text-muted-foreground">{t('bot.imageModeText')}</p>}
                </div>
              </div>
              <Switch id="visual-mode" checked={visualMode} onCheckedChange={setVisualMode} />
            </div>

            {visualMode && (
              <div className="space-y-2 rounded-lg border border-dashed border-primary/40 p-3">
                <div className="flex gap-2">
                  <Input
                    value={imageQuery}
                    onChange={(event) => setImageQuery(event.target.value)}
                    onKeyDown={(event) => event.key === 'Enter' && handleImageSearch()}
                    placeholder={t('bot.imageSearch')}
                  />
                  <Button variant="outline" size="icon" onClick={handleImageSearch} disabled={imageLoading} aria-label={t('bot.search')}>
                    {imageLoading ? <Loader2 className="animate-spin" /> : <Search />}
                  </Button>
                </div>
                {selectedImages.length > 0 && (
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{t('bot.selected', { count: selectedImages.length })}</span>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedImages([])}>{t('bot.clearSelection')}</Button>
                  </div>
                )}
                <div className="grid max-h-40 grid-cols-3 gap-1.5 overflow-y-auto scrollbar-thin">
                  {images.map((image) => {
                    const active = selectedImages.some((item) => item.id === image.id)
                    return (
                      <button
                        type="button"
                        key={image.id}
                        onClick={() => toggleImageSelection(image)}
                        className={cn(
                          'relative aspect-square overflow-hidden rounded-md border-2 transition-all',
                          active ? 'border-primary ring-2 ring-primary/30' : 'border-transparent hover:border-primary/50',
                        )}
                      >
                        <img src={image.thumb} alt={image.alt} loading="lazy" className="size-full object-cover" />
                        {active && (
                          <span className="absolute inset-0 flex items-center justify-center bg-primary/25 text-white">
                            <Check className="size-5" />
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {code && (
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <Label htmlFor="refine-mode" className="cursor-pointer text-sm">{t('bot.refine')}</Label>
                <Switch id="refine-mode" checked={refine} onCheckedChange={setRefine} />
              </div>
            )}

            <Button className="w-full" size="lg" onClick={build} disabled={building || !prompt.trim()}>
              {building ? <Loader2 className="animate-spin" /> : <Sparkles />}
              {building ? t('bot.building') : refine ? t('bot.refine') : t('bot.generate')}
            </Button>
          </CardContent>
        </Card>
        </BlurFade>

        <BlurFade delay={0.1}>
        <Card className="card-premium flex min-h-[70vh] flex-col overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border p-3">
            <Tabs value={view} onValueChange={setView}>
              <TabsList>
                <TabsTrigger value="preview"><Monitor className="size-3.5" /> {t('bot.livePreview')}</TabsTrigger>
                <TabsTrigger value="code"><Code2 className="size-3.5" /> {t('bot.codeView')}</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex flex-wrap items-center gap-1">
              {DEVICES.map((item) => (
                <Button
                  key={item.id}
                  variant={device === item.id ? 'secondary' : 'ghost'}
                  size="icon"
                  onClick={() => setDevice(item.id)}
                  aria-label={t(`bot.${item.id}`)}
                >
                  <item.icon className="size-4" />
                </Button>
              ))}
              <span className="mx-1 h-5 w-px bg-border" />
              <Button variant="ghost" size="sm" onClick={copyCode} disabled={!code}>
                {copied ? <Check /> : <Copy />} <span className="hidden sm:inline">{copied ? t('common.copied') : t('common.copy')}</span>
              </Button>
              <Button variant="ghost" size="sm" onClick={download} disabled={!code}>
                <Download /> <span className="hidden sm:inline">{t('bot.download')}</span>
              </Button>
              <Button variant="ghost" size="sm" onClick={openTab} disabled={!code}>
                <ExternalLink /> <span className="hidden sm:inline">{t('bot.openTab')}</span>
              </Button>
            </div>
          </div>

          <CardContent className="flex flex-1 flex-col bg-muted/30 p-3">
            {!code ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
                <Sparkles className="size-8 opacity-40" />
                {t('bot.welcomeFull')}
              </div>
            ) : view === 'preview' ? (
              <div className="flex flex-1 justify-center overflow-auto rounded-lg bg-white p-2 shadow-inner">
                <iframe
                  key={code.length}
                  title="Website preview"
                  srcDoc={code}
                  sandbox="allow-scripts allow-popups allow-forms"
                  className="h-full min-h-[60vh] w-full border-0 bg-white transition-all duration-300"
                  style={{ maxWidth: activeDevice.width }}
                />
              </div>
            ) : (
              <pre dir="ltr" className="flex-1 overflow-auto rounded-lg bg-code-bg p-4 text-xs leading-relaxed text-code-text scrollbar-thin">
                <code>{code}</code>
              </pre>
            )}
          </CardContent>

          {code && (
            <div className="flex items-center gap-2 border-t border-border px-3 py-2">
              <Badge variant="secondary" className="text-[10px]">HTML</Badge>
              <Badge variant="outline" className="text-[10px]">Tailwind CDN</Badge>
              <span className="ms-auto text-[11px] text-muted-foreground">{code.length.toLocaleString()} {lang === 'ar' ? 'حرف' : 'chars'}</span>
              <X className="hidden size-3 text-muted-foreground sm:block" />
            </div>
          )}
        </Card>
        </BlurFade>
      </div>
    </div>
  )
}
