import { Check, Copy, Volume2, VolumeX } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { renderMarkdown } from '@/lib/markdown'
import { useSettings } from '@/hooks/useSettings'

/** One chat bubble: Markdown body, copy button, speak button and optional images. */
export function ChatMessage({ message, images = [], speaking = false, onSpeak }) {
  const { t } = useSettings()
  const [copied, setCopied] = useState(false)
  const isUser = message.role === 'user'

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(message.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard can be blocked in insecure contexts — silently ignore.
    }
  }

  return (
    <div className={cn('flex', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[85%] rounded-3xl px-4 py-3 text-sm leading-relaxed shadow-soft sm:max-w-[75%]',
          isUser
            ? 'rounded-br-md bg-primary text-primary-foreground shadow-glow'
            : 'rounded-bl-md border border-border/70 bg-muted/70 text-foreground backdrop-blur',
        )}
      >
        <div className="mb-1 flex items-center justify-between gap-4 text-[10px] font-bold uppercase opacity-70">
          <span>{isUser ? t('chat.you') : t('chat.assistant')}</span>
          {!isUser && (
            <span className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="size-6" onClick={handleCopy} aria-label={t('common.copy')}>
                {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={cn('size-6', speaking && 'text-primary')}
                onClick={() => onSpeak?.(message)}
                aria-label={speaking ? t('chat.stopSpeaking') : t('chat.speak')}
              >
                {speaking ? <VolumeX className="size-3" /> : <Volume2 className="size-3" />}
              </Button>
            </span>
          )}
        </div>

        {isUser ? (
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
        ) : (
          <div
            className="chat-markdown break-words"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(message.content) }}
          />
        )}

        {images.length > 0 && (
          <div className="mt-3 grid grid-cols-2 gap-2 border-t border-border/50 pt-3">
            {images.map((image) => (
              <a key={image.id} href={image.url} target="_blank" rel="noreferrer">
                <img
                  src={image.thumb ?? image.url}
                  alt={image.alt}
                  loading="lazy"
                  className="aspect-video w-full rounded-lg object-cover transition-transform hover:scale-[1.03]"
                />
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
