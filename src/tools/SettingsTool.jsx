import { Settings2, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/layout/page-header'
import { BlurFade } from '@/components/magic/blur-fade'
import { clearLocalData } from '@/services/keys'
import { useSettings } from '@/hooks/useSettings'

export function SettingsTool() {
  const { t } = useSettings()

  function handleClear() {
    clearLocalData()
    toast.success(t('settings.cleared'))
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-8 pb-10">
      <PageHeader
        eyebrow={t('nav.tools')}
        title={t('settings.title')}
        subtitle={t('settings.storageHint')}
        icon={Settings2}
      />

      <BlurFade delay={0.05}>
        <Card className="card-premium">
          <CardHeader>
            <CardTitle>{t('settings.storage')}</CardTitle>
            <CardDescription>{t('settings.storageHint')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="destructive" onClick={handleClear}>
              <Trash2 /> {t('settings.clear')}
            </Button>
          </CardContent>
        </Card>
      </BlurFade>
    </div>
  )
}
