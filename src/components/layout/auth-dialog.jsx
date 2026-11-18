import { useState } from 'react'
import { Loader2, LogIn, Mail, ShieldCheck, UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/hooks/useAuth'
import { useSettings } from '@/hooks/useSettings'

function errorMessage(error, t, mode) {
  switch (error?.code) {
    case 'AUTH_EMAIL': return t('auth.emailInvalid')
    case 'AUTH_PASSWORD': return t('auth.passwordShort')
    case 'AUTH_EXISTS': return t('auth.exists')
    case 'AUTH_INVALID': return t('auth.invalid')
    case 'AUTH_NOT_READY':
    case 'AUTH_OFFLINE': return t('auth.unavailable')
    default: return mode === 'register' ? t('auth.registerFailed') : t('auth.loginFailed')
  }
}

function AuthForm({ mode, onSuccess }) {
  const { login, register } = useAuth()
  const { t } = useSettings()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) {
      return setError(t('auth.emailInvalid'))
    }
    if (password.length < 8) {
      return setError(t('auth.passwordShort'))
    }

    setBusy(true)
    try {
      if (mode === 'register') await register(email.trim(), password)
      else await login(email.trim(), password)
      toast.success(t(mode === 'register' ? 'auth.welcome' : 'auth.signedIn'))
      onSuccess()
    } catch (caught) {
      setError(errorMessage(caught, t, mode))
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-4">
      <div className="space-y-2">
        <Label htmlFor={`${mode}-email`}>{t('auth.email')}</Label>
        <div className="relative">
          <Mail className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id={`${mode}-email`}
            type="email"
            dir="ltr"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="ps-9"
            disabled={busy}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${mode}-password`}>{t('auth.password')}</Label>
        <Input
          id={`${mode}-password`}
          type="password"
          dir="ltr"
          autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
          placeholder="••••••••"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          disabled={busy}
        />
        <p className="text-[11px] text-muted-foreground">{t('auth.passwordHint')}</p>
      </div>

      {error && (
        <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs font-semibold leading-relaxed text-destructive">
          {error}
        </p>
      )}

      <Button type="submit" size="lg" className="w-full rounded-xl" disabled={busy}>
        {busy
          ? <Loader2 className="animate-spin" />
          : mode === 'register' ? <UserPlus /> : <LogIn />}
        {busy
          ? t(mode === 'register' ? 'auth.creating' : 'auth.signingIn')
          : t(mode === 'register' ? 'auth.signUpAction' : 'auth.signInAction')}
      </Button>

      <p className="text-center text-xs leading-relaxed text-muted-foreground">
        {t(mode === 'register' ? 'auth.registerHint' : 'auth.loginHint')}
      </p>
    </form>
  )
}

export function AuthDialog({ open, onOpenChange }) {
  const { t } = useSettings()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] overflow-y-auto rounded-3xl p-6 sm:max-w-md">
        <DialogHeader className="space-y-2">
          <div className="mb-1 flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <ShieldCheck className="size-5" />
          </div>
          <DialogTitle className="text-2xl">{t('auth.title')}</DialogTitle>
          <DialogDescription className="leading-relaxed">{t('auth.subtitle')}</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="login" className="mt-1">
          <TabsList className="grid h-auto w-full grid-cols-2 rounded-xl p-1">
            <TabsTrigger value="login" className="rounded-lg text-xs sm:text-sm">{t('auth.signIn')}</TabsTrigger>
            <TabsTrigger value="register" className="rounded-lg text-xs sm:text-sm">{t('auth.signUp')}</TabsTrigger>
          </TabsList>
          <TabsContent value="login">
            <AuthForm mode="login" onSuccess={() => onOpenChange(false)} />
          </TabsContent>
          <TabsContent value="register">
            <AuthForm mode="register" onSuccess={() => onOpenChange(false)} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
