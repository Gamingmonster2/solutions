// eslint-disable-next-line no-unused-vars -- `motion` is used as a JSX namespace below.
import { motion, useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { BorderBeam } from '@/components/magic/border-beam'

/**
 * Magic UI-style glass window floating over an abstract photo.
 *
 * - A soft light sweep travels across the image, then rests before repeating.
 * - The caption sits in a frosted panel with a hairline top highlight.
 * - Responsive 4:3 crop on phones, wider 16:10 crop from `sm` upward.
 * - The animation is disabled when the visitor prefers reduced motion.
 */
export function GlassShine({
  image,
  alt,
  eyebrow,
  title,
  children,
  className,
  priority = false,
  beam = false,
}) {
  const reduceMotion = useReducedMotion()

  const card = (
    <div
      className={cn(
        'group relative isolate overflow-hidden rounded-3xl border border-white/10 bg-card shadow-soft',
        className,
      )}
    >
      <img
        src={image}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        className="aspect-[4/3] w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06] sm:aspect-[16/10]"
      />

      {/* Readability veil: strong at the bottom, transparent at the top. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/25 to-transparent" />

      {/* travelling shine */}
      {!reduceMotion && (
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <motion.div
            className="absolute inset-y-[-20%] left-0 w-1/2 rotate-12 bg-gradient-to-r from-transparent via-white/25 to-transparent blur-md"
            initial={{ x: '-120%' }}
            animate={{ x: '320%' }}
            transition={{ duration: 4.5, repeat: Infinity, repeatDelay: 4, ease: 'easeInOut' }}
          />
        </div>
      )}

      {/* glass window */}
      <div className="absolute inset-x-3 bottom-3 rounded-2xl border border-white/20 bg-white/10 p-4 text-white shadow-lg backdrop-blur-xl sm:inset-x-5 sm:bottom-5 sm:p-5">
        <div aria-hidden className="absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent" />
        {eyebrow && (
          <span className="mb-2 inline-flex rounded-full border border-white/25 bg-white/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white/95">
            {eyebrow}
          </span>
        )}
        <h3 className="text-balance font-display text-lg font-bold leading-snug drop-shadow-sm sm:text-xl">
          {title}
        </h3>
        {children && <div className="mt-2 text-xs leading-relaxed text-white/80 sm:text-sm">{children}</div>}
      </div>
    </div>
  )

  return beam ? <BorderBeam className="rounded-3xl">{card}</BorderBeam> : card
}
