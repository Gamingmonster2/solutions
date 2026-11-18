import { cn } from '@/lib/utils'

/** Ambient gradient field: soft, slow, and always behind the content. */
export function AuroraBackground({ className, children }) {
  return (
    <div className={cn('relative isolate min-h-screen overflow-hidden', className)}>
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="aurora-blob -top-44 -start-40 size-[34rem] bg-primary" />
        <div className="aurora-blob -end-52 top-24 size-[28rem] bg-chart-4 [animation-delay:-7s]" />
        <div className="aurora-blob -bottom-64 start-1/4 size-[32rem] bg-chart-5 [animation-delay:-14s]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,transparent_35%,var(--background)_88%)]" />
      </div>
      {children}
    </div>
  )
}
