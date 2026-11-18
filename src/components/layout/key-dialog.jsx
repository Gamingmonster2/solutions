import { useState } from 'react'
import {
  ChevronDown, ExternalLink, KeyRound, ShieldAlert, ShieldCheck, Trash2,
} from 'lucide-react'
import { toast } from 'sonner'
import { PROVIDERS } from '@/config/providers'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAI } from '@/hooks/useAI'
import { useSettings } from '@/hooks/useSettings'
import { cn } from '@/lib/utils'

function KeyField({ id, label, placeholder, value, onChange, onRemove, link, linkLabel, saved, savedLabel }) {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Label htmlFor={id}>{label}</Label>
        {saved && <Badge variant="secondary" className="rounded-full text-[10px]"><ShieldCheck className="me-1 size-3" />{savedLabel}</Badge>}
      </div>
      <div className="flex gap-2">
        <Input
          id={id}
          type="password"
          dir="ltr"
          autoComplete="off"
          placeholder={placeholder}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="rounded-xl font-mono text-xs"
        />
        {link && (
          <Button variant="outline" size="icon" className="rounded-xl" asChild>
            <a href={link} target="_blank" rel="noreferrer" aria-label={linkLabel} title={linkLabel}>
              <ExternalLink />
            </a>
          </Button>
        )}
        {(value || saved) && (
          <Button variant="ghost" size="icon" className="rounded-xl" onClick={onRemove} aria-label="Remove key">
            <Trash2 />
          </Button>
        )}
      </div>
    </div>
  )
}

export function KeyDialog() {
  const {
    model, hasKeyFor, saveKey, deleteKey,
    dataSharing, updateDataSharing,
    pexelsKey, pixabayKey, savePexelsKey, savePixabayKey,
    hasGroqKey, hasOpenRouterKey,
  } = useAI()
  const { t } = useSettings()
  const [open, setOpen] = useState(false)
  const [advanced, setAdvanced] = useState(false)
  const [groq, setGroq] = useState('')
  const [openRouter, setOpenRouter] = useState('')
  const [pexels, setPexels] = useState(pexelsKey)
  const [pixabay, setPixabay] = useState(pixabayKey)
  const anyKey = hasGroqKey || hasOpenRouterKey

  function handleSave() {
    if (groq.trim()) saveKey(groq, 'groq')
    if (openRouter.trim()) saveKey(openRouter, 'openrouter')
    if (pexels.trim()) savePexelsKey(pexels)
    else if (pexelsKey) savePexelsKey('')
    if (pixabay.trim()) savePixabayKey(pixabay)
    else if (pixabayKey) savePixabayKey('')

    if (!groq.trim() && !openRouter.trim() && !pexels.trim() && !pixabay.trim() && !hasGroqKey && !hasOpenRouterKey) {
      return toast.error(t('header.enterKey'))
    }

    setGroq('')
    setOpenRouter('')
    setOpen(false)
    toast.success(t('header.saved'))
  }

  function handleRemove(provider) {
    deleteKey(provider)
    if (provider === 'groq') setGroq('')
    else setOpenRouter('')
    toast.success(t('header.removed'))
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={anyKey ? 'secondary' : 'outline'} size="sm" className="rounded-xl">
          <KeyRound /> {anyKey ? t('header.byok') : t('header.addKey')}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[88vh] overflow-y-auto rounded-3xl p-6 sm:max-w-xl">
        <DialogHeader className="space-y-2">
          <DialogTitle className="text-2xl">{t('header.keyTitle')}</DialogTitle>
          <DialogDescription className="leading-relaxed">{t('header.keyHelp')}</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue={model.provider === 'openrouter' ? 'openrouter' : 'groq'} className="mt-2">
          <TabsList className="grid h-auto w-full grid-cols-2 rounded-xl p-1">
            <TabsTrigger value="groq" className="rounded-lg text-xs sm:text-sm">
              {PROVIDERS.groq.label}
            </TabsTrigger>
            <TabsTrigger value="openrouter" className="rounded-lg text-xs sm:text-sm">
              {PROVIDERS.openrouter.label}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="groq" className="space-y-4">
            <div className="rounded-2xl border border-border bg-muted/40 p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {t('header.providerGroq')}
                </span>
                {hasKeyFor('groq') && <Badge className="rounded-full text-[10px]">{t('header.byok')}</Badge>}
              </div>
              <KeyField
                id="groq-key"
                label={t('header.keyLabelGroq')}
                placeholder={t('header.keyPlaceholderGroq')}
                value={groq}
                onChange={setGroq}
                onRemove={() => handleRemove('groq')}
                link={PROVIDERS.groq.keyUrl}
                linkLabel={t('header.getGroqKey')}
                saved={hasGroqKey}
                savedLabel={t('common.saved')}
              />
              <Button variant="link" size="sm" className="mt-2 px-0" asChild>
                <a href={PROVIDERS.groq.docsUrl} target="_blank" rel="noreferrer">
                  {t('guide.learnMore')} <ExternalLink />
                </a>
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="openrouter" className="space-y-4">
            <div className="rounded-2xl border border-border bg-muted/40 p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {t('header.providerOpenRouter')}
                </span>
                {hasKeyFor('openrouter') && <Badge className="rounded-full text-[10px]">{t('header.byok')}</Badge>}
              </div>
              <KeyField
                id="openrouter-key"
                label={t('header.keyLabelOpenRouter')}
                placeholder={t('header.keyPlaceholderOpenRouter')}
                value={openRouter}
                onChange={setOpenRouter}
                onRemove={() => handleRemove('openrouter')}
                link={PROVIDERS.openrouter.keyUrl}
                linkLabel={t('header.getOpenRouterKey')}
                saved={hasOpenRouterKey}
                savedLabel={t('common.saved')}
              />
              <Button variant="link" size="sm" className="mt-2 px-0" asChild>
                <a href={PROVIDERS.openrouter.keyUrl} target="_blank" rel="noreferrer">
                  {t('header.getOpenRouterKey')} <ExternalLink />
                </a>
              </Button>
            </div>

            <div className={cn('space-y-3 rounded-2xl border p-4', dataSharing ? 'border-destructive/40 bg-destructive/10' : 'border-primary/25 bg-accent/50')}>
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <Label htmlFor="data-sharing" className="flex items-center gap-2 text-sm font-bold">
                    {dataSharing ? <ShieldAlert className="size-4 text-destructive" /> : <ShieldCheck className="size-4 text-primary" />}
                    {t('header.dataSharing')}
                  </Label>
                  <p className="text-xs leading-relaxed text-muted-foreground">{t('header.dataSharingHint')}</p>
                </div>
                <Switch
                  id="data-sharing"
                  checked={dataSharing}
                  disabled={!hasOpenRouterKey}
                  onCheckedChange={updateDataSharing}
                />
              </div>
              {dataSharing && (
                <p className="rounded-xl bg-destructive/10 p-3 text-xs font-semibold leading-relaxed text-destructive">
                  {t('header.dataSharingWarning')}
                </p>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <button
          type="button"
          onClick={() => setAdvanced((value) => !value)}
          className="mt-2 flex w-full items-center justify-between rounded-xl border border-dashed border-border px-3 py-2.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          {t('header.optionalKeys')}
          <ChevronDown className={cn('size-4 transition-transform', advanced && 'rotate-180')} />
        </button>

        {advanced && (
          <div className="space-y-4 rounded-2xl border border-border bg-muted/40 p-4">
            <p className="text-xs text-muted-foreground">{t('header.optionalNote')}</p>
            <KeyField
              id="pexels-key"
              label={t('header.pexelsKey')}
              placeholder="Pexels key"
              value={pexels}
              onChange={setPexels}
              onRemove={() => { savePexelsKey(''); setPexels('') }}
              link="https://www.pexels.com/api/"
              linkLabel={t('header.pexelsKey')}
              saved={Boolean(pexelsKey)}
              savedLabel={t('common.saved')}
            />
            <KeyField
              id="pixabay-key"
              label={t('header.pixabayKey')}
              placeholder="Pixabay key"
              value={pixabay}
              onChange={setPixabay}
              onRemove={() => { savePixabayKey(''); setPixabay('') }}
              link="https://pixabay.com/api/docs/"
              linkLabel={t('header.pixabayKey')}
              saved={Boolean(pixabayKey)}
              savedLabel={t('common.saved')}
            />
          </div>
        )}

        <DialogFooter className="pt-2">
          <Button className="w-full rounded-xl" size="lg" onClick={handleSave}>
            {t('header.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
