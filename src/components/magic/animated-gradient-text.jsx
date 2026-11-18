import { cn } from '@/lib/utils'

/** Magic UI style headline with a slow flowing brand gradient. */
// eslint-disable-next-line no-unused-vars -- `Tag` is used as a JSX namespace below.
export function AnimatedGradientText({ children, className, as: Tag = 'span' }) {
  return <Tag className={cn('text-gradient inline-block', className)}>{children}</Tag>
}
