import { BookOpen, Github, Heart, Settings2, ShieldCheck, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useSettings } from '@/hooks/useSettings'

export function SiteFooter({ onOpenSettings, onOpenGuide }) {
  const { t } = useSettings()
  const year = new Date().getFullYear()

  return (
    <footer className="mt-auto border-t border-border/70 bg-footer/80 backdrop-blur-xl">
      <div className="mx-auto grid max-w-[1500px] gap-6 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_auto] lg:items-center">
        <div className="space-y-2">
          <div className="flex items-center gap-2 font-display font-extrabold text-primary">
            <Sparkles className="size-4" /> {t('app.name')}
          </div>
          <p className="max-w-xl text-xs leading-relaxed text-muted-foreground">
            © {year} · {t('app.description')}
          </p>
          <p className="text-[11px] text-muted-foreground">{t('quota.reset')} · {t('quota.local')}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="ghost" size="sm" className="rounded-xl" onClick={onOpenGuide}>
            <BookOpen /> {t('nav.guide')}
          </Button>

          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="rounded-xl">
                <ShieldCheck /> {t('about.privacyTitle')}
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-3xl">
              <DialogHeader>
                <DialogTitle>{t('about.privacyTitle')}</DialogTitle>
                <DialogDescription>{t('about.privacyText')}</DialogDescription>
              </DialogHeader>
            </DialogContent>
          </Dialog>

          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="rounded-xl">
                <Heart /> {t('nav.about')}
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-3xl">
              <DialogHeader>
                <DialogTitle>{t('about.title')}</DialogTitle>
                <DialogDescription>{t('about.text')}</DialogDescription>
              </DialogHeader>
            </DialogContent>
          </Dialog>

          <Button variant="ghost" size="sm" className="rounded-xl" onClick={onOpenSettings}>
            <Settings2 /> {t('nav.settings')}
          </Button>

          <Button variant="ghost" size="sm" className="rounded-xl" asChild>
            <a href="https://github.com/Gamingmonster2/solutions" target="_blank" rel="noreferrer">
              <Github /> GitHub
            </a>
          </Button>
        </div>
      </div>
    </footer>
  )
}
