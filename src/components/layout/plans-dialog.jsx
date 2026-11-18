import { useCallback, useEffect, useState } from 'react'
import {
  AlertTriangle, ArrowLeft, Check, Copy, ExternalLink, Loader2,
  RefreshCw, Sparkles, Wallet,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { AuthDialog } from '@/components/layout/auth-dialog'
import { useAuth } from '@/hooks/useAuth'
import { useAI } from '@/hooks/useAI'
import { useSettings } from '@/hooks/useSettings'
import { paymentsApi } from '@/services/payments'

const OPEN_STATUSES = new Set(['pending', 'detected'])

function errorText(error, t) {
  switch (error?.code) {
    case 'PAY_NOT_READY': return t('pay.notReady')
    case 'PAY_RPC_UNAVAILABLE': return t('pay.rpcDown')
    case 'PAY_AMOUNT_COLLISION': return t('pay.retry')
    case 'PAY_OFFLINE': return t('pay.offline')
    case 'AUTH_REQUIRED': return t('pay.needAuth')
    default: return t('pay.error')
  }
}

function statusLabel(status, t) {
  return t({
    pending: 'pay.waiting',
    detected: 'pay.confirming',
    paid: 'pay.paid',
    late: 'pay.late',
    expired: 'pay.expired',
  }[status] ?? 'pay.waiting')
}

function countdown(ms) {
  const total = Math.max(0, Math.floor(ms / 1000))
  const pad = (value) => String(value).padStart(2, '0')
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const seconds = total % 60
  return hours ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${pad(minutes)}:${pad(seconds)}`
}

export function PlansDialog({ open, onOpenChange }) {
  const { t, lang } = useSettings()
  const { isAuthenticated } = useAuth()
  const { paidRemaining = 0, refreshAccount } = useAI()

  const [catalog, setCatalog] = useState(null)
  const [invoice, setInvoice] = useState(null)
  const [loading, setLoading] = useState(false)
  const [busyPlan, setBusyPlan] = useState('')
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState('')
  const [authOpen, setAuthOpen] = useState(false)
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    if (!open) return
    setError('')
    setInvoice(null)
    setLoading(true)
    paymentsApi.plans()
      .then(setCatalog)
      .catch((caught) => setError(errorText(caught, t)))
      .finally(() => setLoading(false))
  }, [open, t])

  useEffect(() => {
    if (!open || !invoice) return undefined
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [open, invoice])

  const settle = useCallback((next) => {
    setInvoice(next)
    if (next.status === 'paid') {
      refreshAccount?.()
      toast.success(t('pay.success', { credits: next.credits }))
    }
  }, [refreshAccount, t])

  const invoiceId = invoice?.id
  const invoiceState = invoice?.status
  useEffect(() => {
    if (!open || !invoiceId || !invoiceState || !OPEN_STATUSES.has(invoiceState)) return undefined
    const timer = setInterval(() => {
      paymentsApi.status(invoiceId).then(settle).catch(() => {})
    }, 8000)
    return () => clearInterval(timer)
  }, [open, invoiceId, invoiceState, settle])

  async function handleCopy(value) {
    try {
      await navigator.clipboard.writeText(value)
      toast.success(t('pay.copied'))
    } catch {
      toast.error(t('pay.copyFailed'))
    }
  }

  async function handleBuy(planId) {
    setBusyPlan(planId)
    setError('')
    try {
      setInvoice(await paymentsApi.createInvoice(planId))
    } catch (caught) {
      setError(errorText(caught, t))
    } finally {
      setBusyPlan('')
    }
  }

  async function handleCheck() {
    if (!invoice) return
    setChecking(true)
    try {
      settle(await paymentsApi.status(invoice.id))
    } catch (caught) {
      setError(errorText(caught, t))
    } finally {
      setChecking(false)
    }
  }

  const plans = catalog?.plans ?? []
  const network = catalog?.network
  const expired = invoice ? Date.parse(invoice.acceptUntil) <= now : false

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl p-6 sm:max-w-2xl">
        <DialogHeader className="space-y-2">
          <div className="mb-1 flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Sparkles className="size-5" />
          </div>
          <DialogTitle className="text-2xl">{t('pay.title')}</DialogTitle>
          <DialogDescription className="leading-relaxed">{t('pay.subtitle')}</DialogDescription>
        </DialogHeader>

        {loading && !catalog && (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
            <Loader2 className="animate-spin" /> {t('common.loading')}
          </div>
        )}

        {paidRemaining > 0 && (
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-3 text-sm font-semibold text-primary">
            {t('pay.balance', { credits: paidRemaining })}
          </div>
        )}

        {error && (
          <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs font-semibold leading-relaxed text-destructive">
            {error}
          </p>
        )}

        {!isAuthenticated && catalog && (
          <div className="space-y-3 rounded-2xl border border-border bg-card/60 p-5 text-center">
            <Wallet className="mx-auto size-6 text-primary" />
            <p className="text-sm leading-relaxed text-muted-foreground">{t('pay.signInFirst')}</p>
            <Button className="rounded-xl" onClick={() => setAuthOpen(true)}>{t('auth.signIn')}</Button>
          </div>
        )}

        {isAuthenticated && !invoice && catalog && (
          <div className="grid gap-3 sm:grid-cols-3">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className="relative flex flex-col gap-3 rounded-2xl border border-border bg-card/70 p-5 shadow-sm transition-all hover:border-primary/40 hover:shadow-md"
              >
                {plan.popular && (
                  <Badge className="absolute -top-2.5 start-4 rounded-full bg-gradient-to-r from-primary to-chart-2 text-[10px]">
                    {t('pay.popular')}
                  </Badge>
                )}
                <p className="font-display text-base font-bold">{plan.name[lang] ?? plan.name.en}</p>
                <p className="font-display text-3xl font-extrabold tracking-tight">${plan.priceUsd}</p>
                <p className="text-xs text-muted-foreground">{t('pay.credits', { credits: plan.credits })}</p>
                <Button
                  className="mt-auto w-full rounded-xl"
                  size="sm"
                  disabled={Boolean(busyPlan) || catalog.ready === false}
                  onClick={() => handleBuy(plan.id)}
                >
                  {busyPlan === plan.id ? <Loader2 className="animate-spin" /> : <Sparkles />}
                  {t('pay.select')}
                </Button>
              </div>
            ))}
          </div>
        )}

        {isAuthenticated && invoice && (
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => setInvoice(null)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="size-3.5 rtl:rotate-180" /> {t('pay.back')}
            </button>

            <div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card/70 p-4">
              <div>
                <p className="text-xs text-muted-foreground">{t('pay.invoiceTitle')}</p>
                <p dir="ltr" className="font-mono text-xs font-semibold">{invoice.id.slice(0, 18)}…</p>
              </div>
              <Badge variant={invoice.status === 'paid' ? 'default' : 'secondary'} className="rounded-full px-3">
                {invoice.status === 'paid' && <Check className="me-1 size-3" />}
                {statusLabel(invoice.status, t)}
              </Badge>
            </div>

            <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 to-chart-2/5 p-5 text-center">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('pay.sendExact')}</p>
              <p dir="ltr" className="my-2 break-all font-display text-3xl font-extrabold tracking-tight text-foreground">
                {invoice.amount} <span className="text-lg text-primary">{invoice.coin}</span>
              </p>
              <Button variant="outline" size="sm" className="rounded-xl" onClick={() => handleCopy(invoice.amount)}>
                <Copy /> {t('pay.copyAmount')}
              </Button>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground">{t('pay.address')}</p>
              <div dir="ltr" className="flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-background/70 p-3">
                <code className="min-w-0 flex-1 break-all font-mono text-xs font-semibold">{invoice.address}</code>
                <Button variant="ghost" size="icon" className="rounded-lg" onClick={() => handleCopy(invoice.address)} aria-label={t('pay.copyAddress')}>
                  <Copy />
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <Badge variant="secondary" className="rounded-full">
                {network?.chainLabel?.[lang] ?? t('pay.polygon')} · {invoice.coin}
              </Badge>
              <span className={expired ? 'font-semibold text-destructive' : 'text-muted-foreground'}>
                {expired ? t('pay.expired') : `${t('pay.timeLeft')} ${countdown(Date.parse(invoice.acceptUntil) - now)}`}
              </span>
              {invoice.explorerTxUrl && (
                <a href={invoice.explorerTxUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold text-primary hover:underline">
                  {t('pay.viewTx')} <ExternalLink className="size-3" />
                </a>
              )}
            </div>

            <div className="rounded-2xl border border-amber-500/25 bg-amber-500/10 p-4 text-xs leading-relaxed text-amber-700 dark:text-amber-300">
              <p className="mb-2 flex items-center gap-1.5 font-bold">
                <AlertTriangle className="size-4 shrink-0" /> {t('pay.networkWarning')}
              </p>
              <ol className="list-inside list-decimal space-y-1">
                <li>{t('pay.step1')}</li>
                <li>{t('pay.step2')}</li>
                <li>{t('pay.step3', { amount: invoice.amount })}</li>
                <li>{t('pay.step4')}</li>
              </ol>
            </div>

            <Button
              variant="outline"
              className="w-full rounded-xl"
              onClick={handleCheck}
              disabled={checking || !OPEN_STATUSES.has(invoice.status)}
            >
              {checking ? <Loader2 className="animate-spin" /> : <RefreshCw />}
              {t('pay.check')}
            </Button>
          </div>
        )}

        <p className="text-center text-[11px] leading-relaxed text-muted-foreground">{t('pay.disclaimer')}</p>
      </DialogContent>

      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />
    </Dialog>
  )
}
