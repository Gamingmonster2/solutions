import { useState } from 'react'
import { LogIn, LogOut, Loader2, UserRound } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { AuthDialog } from '@/components/layout/auth-dialog'
import { useAuth } from '@/hooks/useAuth'
import { useSettings } from '@/hooks/useSettings'

export function AccountButton() {
  const { user, loading, logout } = useAuth()
  const { t } = useSettings()
  const [open, setOpen] = useState(false)

  if (loading) {
    return (
      <Button variant="ghost" size="icon" className="rounded-xl" disabled aria-label={t('auth.signIn')}>
        <Loader2 className="animate-spin" />
      </Button>
    )
  }

  if (!user) {
    return (
      <>
        <Button variant="outline" size="sm" className="rounded-xl" onClick={() => setOpen(true)}>
          <LogIn /> <span className="max-sm:hidden">{t('auth.signIn')}</span>
        </Button>
        <AuthDialog open={open} onOpenChange={setOpen} />
      </>
    )
  }

  async function handleLogout() {
    await logout()
    toast.success(t('auth.signedOut'))
  }

  return (
    <div className="flex items-center gap-1">
      <span
        className="hidden max-w-[150px] items-center gap-1.5 rounded-xl border border-border bg-background/60 px-2.5 py-1.5 text-xs font-semibold text-foreground xl:inline-flex"
        title={user.email}
      >
        <UserRound className="size-3.5 text-primary" />
        <span className="truncate">{user.email}</span>
      </span>
      <Button
        variant="ghost"
        size="icon"
        className="rounded-xl"
        onClick={handleLogout}
        aria-label={t('auth.signOut')}
        title={t('auth.signOut')}
      >
        <LogOut />
      </Button>
    </div>
  )
}
