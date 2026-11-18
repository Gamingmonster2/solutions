import { useState } from 'react'
import {
  Bot, BookOpen, Code2, Globe2, Languages, LayoutGrid, MessageSquare,
  Moon, Palette, Settings2, Sparkles, Sun, Zap,
} from 'lucide-react'
import { TOOLS } from '@/config/tools'
import { useSettings } from '@/hooks/useSettings'
import { Button } from '@/components/ui/button'
import { ModelPicker } from '@/components/layout/model-picker'
import { KeyDialog } from '@/components/layout/key-dialog'
import { QuotaIndicator } from '@/components/layout/quota-indicator'
import { AccountButton } from '@/components/layout/account-button'
import { PlansDialog } from '@/components/layout/plans-dialog'

const TOOL_ICONS = { LayoutGrid, MessageSquare, Globe2, Code2, Bot, BookOpen }

export function SiteHeader({ activeTool, onToolChange }) {
  const { lang, theme, toggleLang, toggleTheme, t } = useSettings()
  const [plansOpen, setPlansOpen] = useState(false)
  const themeIcon = theme === 'dark' ? <Sun /> : theme === 'beige' ? <Palette /> : <Moon />

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-header/85 backdrop-blur-2xl transition-colors supports-[backdrop-filter]:bg-header/65">
      <div className="mx-auto flex max-w-[1500px] flex-col gap-3 px-4 py-3 sm:px-6 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-center justify-between gap-3 xl:justify-start">
          <button
            type="button"
            onClick={() => onToolChange('solutions')}
            className="group flex items-center gap-3 rounded-2xl text-start"
            aria-label={t('app.name')}
          >
            <span className="relative flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary via-primary to-chart-2 text-primary-foreground shadow-glow transition-transform group-hover:scale-105">
              <Sparkles className="size-5" />
              <span className="absolute -inset-1 -z-10 rounded-2xl bg-primary/25 blur-lg transition-opacity group-hover:opacity-100 opacity-0" />
            </span>
            <span className="leading-tight">
              <span className="block font-display text-lg font-extrabold tracking-tight">{t('app.name')}</span>
              <span className="hidden text-[11px] font-medium text-muted-foreground sm:block">{t('app.tagline')}</span>
            </span>
          </button>

          <div className="flex items-center gap-1.5 xl:hidden">
            <QuotaIndicator />
            <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => setPlansOpen(true)} aria-label={t('pay.plans')} title={t('pay.plans')}>
              <Zap />
            </Button>
            <KeyDialog />
            <AccountButton />
          </div>
        </div>

        <nav
          aria-label={t('nav.tools')}
          className="order-3 min-w-0 xl:order-none"
        >
          <div className="flex h-auto w-full flex-nowrap justify-start gap-0.5 overflow-x-auto rounded-2xl border border-border/70 bg-background/60 p-1.5 shadow-sm scrollbar-thin xl:w-auto xl:justify-center">
            {TOOLS.map((tool) => {
              const Icon = TOOL_ICONS[tool.icon] ?? LayoutGrid
              const active = tool.id === activeTool
              return (
                <button
                  key={tool.id}
                  type="button"
                  onClick={() => onToolChange(tool.id)}
                  aria-current={active ? 'page' : undefined}
                  className={
                    active
                      ? 'inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-background px-3 py-2 text-xs font-semibold text-foreground shadow-sm transition-all sm:text-sm'
                      : 'inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-muted-foreground transition-all hover:bg-accent hover:text-accent-foreground sm:text-sm'
                  }
                >
                  <Icon className="size-3.5 text-primary" />
                  {tool.label[lang]}
                </button>
              )
            })}
          </div>
        </nav>

        <div className="flex items-center gap-1.5">
          <div className="hidden xl:block"><QuotaIndicator /></div>
          <ModelPicker />
          <Button variant="outline" size="sm" className="rounded-xl" onClick={() => setPlansOpen(true)}>
            <Zap /> <span className="max-sm:hidden">{t('pay.plans')}</span>
          </Button>
          <div className="hidden xl:block"><KeyDialog /></div>
          <div className="hidden xl:block"><AccountButton /></div>
          <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => onToolChange('settings')} aria-label={t('nav.settings')} title={t('nav.settings')}>
            <Settings2 />
          </Button>
          <Button variant="ghost" size="icon" className="rounded-xl" onClick={toggleTheme} aria-label={t('theme.toggle')} title={t('theme.toggle')}>
            {themeIcon}
          </Button>
          <Button variant="outline" size="sm" className="rounded-xl" onClick={toggleLang} aria-label={t('lang.toggle')}>
            <Languages className="max-sm:hidden" /> {t('lang.toggle')}
          </Button>
        </div>
      </div>

      <PlansDialog open={plansOpen} onOpenChange={setPlansOpen} />
    </header>
  )
}
