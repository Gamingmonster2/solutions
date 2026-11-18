import { cn } from '@/lib/utils'

/** Magic UI style animated edge that frames a highlighted card. */
export function BorderBeam({ children, className }) {
  return (
    <div className={cn('relative isolate rounded-[inherit]', className)}>
      <div aria-hidden className="pointer-events-none absolute -inset-px -z-10 overflow-hidden rounded-[inherit]">
        <div className="absolute left-1/2 top-1/2 aspect-square w-[180%] -translate-x-1/2 -translate-y-1/2 animate-spin bg-[conic-gradient(from_0deg,transparent_0%,var(--primary)_10%,var(--chart-2)_16%,transparent_28%)] [animation-duration:7s]" />
      </div>
      <div className="relative rounded-[inherit]">{children}</div>
    </div>
  )
}
