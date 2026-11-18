import { useState } from 'react'
import { ArrowRight, Check, Code2, Copy, Edit3, ExternalLink, Loader2, Sparkles, WandSparkles } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useAI } from '@/hooks/useAI'
import { useSettings } from '@/hooks/useSettings'
import { STORAGE_KEYS } from '@/config/limits'
import { BlurFade } from '@/components/magic/blur-fade'
import { PageHeader } from '@/components/layout/page-header'

const LANGUAGES = [
  'HTML/Tailwind CSS',
  'JavaScript',
  'Python',
  'React',
  'Node.js',
  'PHP',
]

export function CodeTool() {
  const { t, lang } = useSettings()
  const { run } = useAI()

  const [idea, setIdea] = useState('')
  const [enhanced, setEnhanced] = useState('')
  const [requirements, setRequirements] = useState('')
  const [language, setLanguage] = useState(LANGUAGES[0])
  const [code, setCode] = useState(() => localStorage.getItem(STORAGE_KEYS.code) ?? '')
  const [enhancing, setEnhancing] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const [copied, setCopied] = useState(false)

  async function enhance() {
    const text = idea.trim()
    if (!text) return toast.error(t('common.enterPrompt'))
    setEnhancing(true)
    try {
      const result = await run({
        messages: [
          {
            role: 'system',
            content: `You are an expert software architect. Expand this simple idea into a highly detailed, professional prompt for an AI code generator. Write in ${lang === 'ar' ? 'Arabic' : 'English'}. Output ONLY the enhanced prompt text.`,
          },
          { role: 'user', content: `Idea: ${text}` },
        ],
        maxTokens: 1024,
      })
      setEnhanced(result.text)
    } catch (error) {
      toast.error(error.message || t('common.error'))
    } finally {
      setEnhancing(false)
    }
  }

  function moveToRequirements() {
    if (!enhanced) return
    setRequirements(enhanced)
    document.getElementById('code-requirements')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  async function generate(event) {
    event.preventDefault()
    const reqs = requirements.trim()
    if (!reqs) return toast.error(t('code.requirementsPlaceholder'))

    setGenerating(true)
    try {
      const result = await run({
        messages: [
          {
            role: 'system',
            content: `You are an advanced AI coding engine.
STRICT RULES:
- Output ONLY complete, working code.
- No explanations, no prose, no markdown fences.
- Include all imports and boilerplate needed to run.`,
          },
          {
            role: 'user',
            content: `REQUIREMENTS: ${reqs}\nLANGUAGE: ${language}`,
          },
        ],
        maxTokens: 4096,
      })
      setCode(result.text)
      localStorage.setItem(STORAGE_KEYS.code, result.text)
      setEditing(false)
      toast.success(t('code.generated'))
    } catch (error) {
      toast.error(error.message || t('common.error'))
    } finally {
      setGenerating(false)
    }
  }

  async function copyCode() {
    if (!code) return
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
      toast.success(t('code.copied'))
    } catch {
      toast.error(t('common.error'))
    }
  }

  function startEdit() {
    setDraft(code)
    setEditing(true)
  }

  function saveEdit() {
    setCode(draft)
    localStorage.setItem(STORAGE_KEYS.code, draft)
    setEditing(false)
    toast.success(t('code.saved'))
  }

  function preview() {
    if (!code) return
    const source = /<!doctype html>/i.test(code) ? code : `<!doctype html><html><body style="margin:0;background:#1e1e1e;color:#f8f8f2;font:14px monospace;white-space:pre-wrap;padding:20px">${code.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</body></html>`
    const url = URL.createObjectURL(new Blob([source], { type: 'text/html;charset=utf-8' }))
    window.open(url, '_blank', 'noopener')
    setTimeout(() => URL.revokeObjectURL(url), 60000)
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 pb-10">
      <PageHeader
        eyebrow={t('nav.tools')}
        title={t('code.title')}
        subtitle={t('code.subtitle')}
        icon={Code2}
      />

      <BlurFade delay={0.05}>
      <Card className="card-premium">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-xs text-primary-foreground">1</span>
            {t('code.step1')}
          </CardTitle>
          <CardDescription>{t('code.step1hint')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            rows={4}
            value={idea}
            onChange={(event) => setIdea(event.target.value)}
            placeholder={t('code.ideaPlaceholder')}
          />
          <Button variant="secondary" onClick={enhance} disabled={enhancing || !idea.trim()}>
            {enhancing ? <Loader2 className="animate-spin" /> : <WandSparkles />}
            {enhancing ? t('code.enhancing') : t('code.enhance')}
          </Button>

          {enhanced && (
            <div className="space-y-3 rounded-lg border-l-4 border-primary bg-accent/40 p-4">
              <div className="text-xs font-bold uppercase text-primary">{t('code.enhanced')}</div>
              <Textarea
                rows={5}
                value={enhanced}
                onChange={(event) => setEnhanced(event.target.value)}
                className="bg-background"
              />
              <Button size="sm" onClick={moveToRequirements}>
                {t('code.useEnhanced')} <ArrowRight className="rtl:rotate-180" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      </BlurFade>

      <BlurFade delay={0.1}>
      <Card className="card-premium">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-xs text-primary-foreground">2</span>
            {t('code.step2')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={generate} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="code-language">{t('code.language')}</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger id="code-language" dir="ltr" className="w-full sm:w-72"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((item) => <SelectItem key={item} value={item} dir="ltr">{item}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="code-requirements">{t('code.requirements')}</Label>
              <Textarea
                id="code-requirements"
                rows={6}
                value={requirements}
                onChange={(event) => setRequirements(event.target.value)}
                placeholder={t('code.requirementsPlaceholder')}
              />
            </div>

            <Button type="submit" disabled={generating || !requirements.trim()}>
              {generating ? <Loader2 className="animate-spin" /> : <Code2 />}
              {generating ? t('code.generating') : t('code.generate')}
            </Button>
          </form>
        </CardContent>
      </Card>
      </BlurFade>

      {code && (
        <BlurFade delay={0.15}>
        <Card className="card-premium overflow-hidden">
          <div className="flex flex-wrap items-center gap-2 border-b border-border p-3">
            <Sparkles className="size-4 text-primary" />
            <span className="text-sm font-bold">{t('code.previewTitle')}</span>
            <div className="ms-auto flex flex-wrap gap-1">
              <Button variant="ghost" size="sm" onClick={copyCode} disabled={editing}>
                {copied ? <Check /> : <Copy />} <span className="hidden sm:inline">{copied ? t('common.copied') : t('common.copy')}</span>
              </Button>
              <Button variant="ghost" size="sm" onClick={preview} disabled={editing}>
                <ExternalLink /> <span className="hidden sm:inline">{t('common.preview')}</span>
              </Button>
              {editing ? (
                <>
                  <Button variant="default" size="sm" onClick={saveEdit}><Check /> {t('code.saveChanges')}</Button>
                  <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>{t('code.cancel')}</Button>
                </>
              ) : (
                <Button variant="ghost" size="sm" onClick={startEdit}><Edit3 /> {t('common.edit')}</Button>
              )}
            </div>
          </div>
          {editing ? (
            <Textarea
              dir="ltr"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              className="min-h-[400px] rounded-none border-0 bg-code-bg font-mono text-sm text-code-text focus-visible:ring-0"
            />
          ) : (
            <pre dir="ltr" className="max-h-[600px] overflow-auto bg-code-bg p-5 text-sm leading-relaxed text-code-text scrollbar-thin">
              <code>{code}</code>
            </pre>
          )}
        </Card>
        </BlurFade>
      )}
    </div>
  )
}
