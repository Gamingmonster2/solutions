import { useRef } from 'react'
// eslint-disable-next-line no-unused-vars -- `motion` is used as a JSX namespace below.
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { cn } from '@/lib/utils'

/** Cursor-following light, adapted for both LTR and RTL. */
export function Spotlight({ className, children }) {
  const ref = useRef(null)
  const mouseX = useMotionValue(-500)
  const mouseY = useMotionValue(-500)
  const springX = useSpring(mouseX, { damping: 25, stiffness: 180 })
  const springY = useSpring(mouseY, { damping: 25, stiffness: 180 })

  const background = useTransform(
    [springX, springY],
    ([x, y]) =>
      `radial-gradient(320px circle at ${x}px ${y}px, color-mix(in oklab, var(--primary) 16%, transparent), transparent 70%)`,
  )

  function handleMove(event) {
    const bounds = ref.current?.getBoundingClientRect()
    if (!bounds) return
    mouseX.set(event.clientX - bounds.left)
    mouseY.set(event.clientY - bounds.top)
  }

  return (
    <div ref={ref} onMouseMove={handleMove} className={cn('group relative overflow-hidden', className)}>
      <motion.div aria-hidden className="pointer-events-none absolute inset-0 z-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100" style={{ background }} />
      <div className="relative z-10">{children}</div>
    </div>
  )
}
