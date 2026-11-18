import { useRef } from 'react'
// eslint-disable-next-line no-unused-vars -- `motion` is used as a JSX namespace below.
import { motion, useInView } from 'framer-motion'
import { cn } from '@/lib/utils'

/** Magic UI style entrance animation — content fades and lifts into view. */
export function BlurFade({ children, className, delay = 0, duration = 0.55, y = 18 }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, filter: 'blur(10px)', transform: `translateY(${y}px)` }}
      animate={inView ? { opacity: 1, filter: 'blur(0px)', transform: 'translateY(0px)' } : undefined}
      transition={{ duration, delay, ease: [0.22, 1, 0.36, 1] }}
      className={cn(className)}
    >
      {children}
    </motion.div>
  )
}
