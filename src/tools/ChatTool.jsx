import { useEffect, useRef, useState } from 'react'
import { Loader2, MessageSquare, Mic, MicOff, Send, Settings2, SquarePen, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { ChatMessage } from '@/components/chat-panel'
import { BlurFade } from '@/components/magic/blur-fade'
import { PageHeader } from '@/components/layout/page-header'
import { useAI } from '@/hooks/useAI'
import { useSettings } from '@/hooks/useSettings'
import { extractKeywords, searchPexels } from '@/services/images'
import { createRecognition, speakText, stopSpeaking } from '@/lib/speech'
import { cn } from '@/lib/utils'

const SESSION_KEY = 'solutions_chat_sessions'
const SESSION_EXPIRY = 7 * 24 * 60 * 60 * 1000

function loadSessions() {
  try {
    const parsed = JSON.parse(localStorage.getItem(SESSION_KEY) ?? '[]')
    const cutoff = Date.now() - SESSION_EXPIRY
    return Array.isArray(parsed) ? parsed.filter((session) => session.updatedAt > cutoff) : []
  } catch {
    return []
  }
}

function newId() {
  return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

export function ChatTool() {
  const { run, pexelsKey } = useAI()
  const { t, lang } = useSettings()

  const [sessions, setSessions] = useState(loadSessions)
  const [currentId, setCurrentId] = useState(() => loadSessions()[0]?.id ?? null)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [recording, setRecording] = useState(false)
  const [speakingId, setSpeakingId] = useState(null)
  const [autoSpeak, setAutoSpeak] = useState(() => localStorage.getItem('solutions_chat_autospeak') === 'true')
  const [speechRate, setSpeechRate] = useState(() => Number(localStorage.getItem('solutions_chat_rate') ?? '1'))
  const [showSettings, setShowSettings] = useState(false)

  const recognitionRef = useRef(null)
  const endRef = useRef(null)

  const currentSession = sessions.find((session) => session.id === currentId)
  const messages = currentSession?.messages ?? []

  useEffect(() => {
    localStorage.setItem(SESSION_KEY, JSON.stringify(sessions.slice(0, 30)))
  }, [sessions])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length, loading])

  useEffect(() => {
    recognitionRef.current = createRecognition({
      lang: lang === 'ar' ? 'ar-SA' : 'en-US',
      onResult: setInput,
      onStart: () => setRecording(true),
      onEnd: () => setRecording(false),
    })
    return () => recognitionRef.current?.abort?.()
  }, [lang])

  function createSession() {
    const id = `session_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
    const session = {
      id,
      title: t('chat.newSession'),
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    setSessions((previous) => [session, ...previous])
    setCurrentId(id)
    return id
  }

  function deleteSession(id) {
    if (!window.confirm(t('chat.deleteConfirm'))) return
    setSessions((previous) => {
      const remaining = previous.filter((session) => session.id !== id)
      if (id === currentId) setCurrentId(remaining[0]?.id ?? null)
      return remaining
    })
  }

  function updateMessages(id, updater) {
    setSessions((previous) =>
      previous.map((session) =>
        session.id === id
          ? { ...session, messages: updater(session.messages), updatedAt: Date.now() }
          : session,
      ),
    )
  }

  function handleSpeak(message) {
    if (speakingId === message.id) {
      stopSpeaking()
      setSpeakingId(null)
      return
    }
    setSpeakingId(message.id)
    speakText(message.content, {
      rate: speechRate,
      lang,
      onEnd: () => setSpeakingId(null),
      onError: () => setSpeakingId(null),
    })
  }

  function toggleRecording() {
    const recognition = recognitionRef.current
    if (!recognition) return toast.error(t('chat.voiceInput'))
    if (recording) {
      recognition.stop()
    } else {
      setInput('')
      try {
        recognition.start()
      } catch {
        // Already started — ignore.
      }
    }
  }

  function changeAutoSpeak(value) {
    setAutoSpeak(value)
    localStorage.setItem('solutions_chat_autospeak', String(value))
    if (!value) {
      stopSpeaking()
      setSpeakingId(null)
    }
  }

  function changeRate(value) {
    setSpeechRate(value)
    localStorage.setItem('solutions_chat_rate', String(value))
  }

  async function send() {
    const text = input.trim()
    if (!text || loading) return

    stopSpeaking()
    setSpeakingId(null)
    setInput('')

    const activeId = currentId ?? createSession()
    const baseMessages = currentSession?.messages ?? []
    const userMessage = { id: newId(), role: 'user', content: text }

    updateMessages(activeId, (previous) => [
      ...previous,
      userMessage,
    ])
    setSessions((previous) =>
      previous.map((session) =>
        session.id === activeId && session.messages.length === 0
          ? { ...session, title: text.slice(0, 40) + (text.length > 40 ? '…' : '') }
          : session,
      ),
    )

    setLoading(true)
    try {
      const result = await run({
        messages: [
          {
            role: 'system',
            content: `You are a helpful, concise AI assistant. Answer in the same language as the user. Use Markdown for formatting when useful. Today is ${new Date().toISOString().slice(0, 10)}.`,
          },
          ...baseMessages.map(({ role, content }) => ({ role, content })),
          { role: 'user', content: text },
        ],
        maxTokens: 2048,
      })

      const assistantMessage = { id: newId(), role: 'assistant', content: result.text, images: [] }
      updateMessages(activeId, (previous) => [...previous, assistantMessage])

      if (autoSpeak) {
        setSpeakingId(assistantMessage.id)
        speakText(result.text, {
          rate: speechRate,
          lang,
          onEnd: () => setSpeakingId(null),
          onError: () => setSpeakingId(null),
        })
      }

      if (pexelsKey) {
        const keywords = extractKeywords(text)
        if (keywords) {
          try {
            const images = await searchPexels(keywords, pexelsKey)
            if (images.length) {
              updateMessages(activeId, (previous) =>
                previous.map((message) =>
                  message.id === assistantMessage.id ? { ...message, images } : message,
                ),
              )
            }
          } catch {
            // Image enrichment is best-effort and must never break the chat.
          }
        }
      }
    } catch (error) {
      toast.error(error.message || t('common.error'))
      updateMessages(activeId, (previous) => previous.filter((message) => message.id !== userMessage.id))
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      send()
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 pb-10">
      <PageHeader
        title={t('chat.title')}
        subtitle={t('chat.subtitle')}
        icon={MessageSquare}
        actions={
          <>
            <Select value={currentId ?? ''} onValueChange={setCurrentId}>
              <SelectTrigger className="w-[180px] md:hidden">
                <SelectValue placeholder={t('chat.sessions')} />
              </SelectTrigger>
              <SelectContent>
                {sessions.map((session) => (
                  <SelectItem key={session.id} value={session.id}>{session.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={createSession}>
              <SquarePen /> {t('chat.newSession')}
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setShowSettings((value) => !value)} aria-label={t('nav.settings')}>
              <Settings2 />
            </Button>
          </>
        }
      />

      {showSettings && (
        <div className="flex flex-wrap items-center gap-6 rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2">
            <Switch id="auto-speak" checked={autoSpeak} onCheckedChange={changeAutoSpeak} />
            <Label htmlFor="auto-speak">{t('chat.autoSpeak')}</Label>
          </div>
          <div className="flex items-center gap-3">
            <Label htmlFor="speech-rate">{t('chat.speechRate')}</Label>
            <input
              id="speech-rate"
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={speechRate}
              onChange={(event) => changeRate(Number(event.target.value))}
              className="w-32 accent-[var(--primary)]"
            />
            <span className="w-8 text-xs text-muted-foreground">{speechRate.toFixed(1)}x</span>
          </div>
        </div>
      )}

      <BlurFade delay={0.05}>
      <div className="flex gap-4">
        <aside className="hidden w-56 shrink-0 space-y-2 md:block">
          <div className="px-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">{t('chat.sessions')}</div>
          <div className="max-h-[55vh] space-y-1 overflow-y-auto scrollbar-thin">
            {sessions.length === 0 && (
              <p className="px-2 py-4 text-xs text-muted-foreground">{t('common.empty')}</p>
            )}
            {sessions.map((session) => (
              <div
                key={session.id}
                className={cn(
                  'group flex items-center gap-2 rounded-lg border border-transparent px-3 py-2 text-sm transition-colors',
                  session.id === currentId
                    ? 'border-primary/30 bg-accent text-accent-foreground'
                    : 'hover:bg-muted',
                )}
              >
                <button
                  type="button"
                  onClick={() => setCurrentId(session.id)}
                  className="flex min-w-0 flex-1 items-center gap-2 text-start"
                >
                  <MessageSquare className="size-3.5 shrink-0 opacity-60" />
                  <span className="truncate">{session.title}</span>
                </button>
                <button
                  type="button"
                  onClick={() => deleteSession(session.id)}
                  className="opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                  aria-label={t('chat.deleteSession')}
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            ))}
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <div className="flex-1 space-y-4 overflow-y-auto p-4 scrollbar-thin" style={{ minHeight: '45vh' }}>
            {messages.length === 0 && (
              <div className="flex h-full min-h-[240px] items-center justify-center text-center text-sm text-muted-foreground">
                <div>
                  <div className="mb-2 text-4xl">✦</div>
                  {t('chat.welcome')}
                </div>
              </div>
            )}

            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message}
                images={message.images ?? []}
                speaking={speakingId === message.id}
                onSpeak={handleSpeak}
              />
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin text-primary" /> {t('chat.thinking')}
              </div>
            )}
            <div ref={endRef} />
          </div>

          <div className="flex items-end gap-2 border-t border-border p-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleRecording}
              disabled={!recognitionRef.current}
              className={cn(recording && 'animate-pulse text-destructive')}
              aria-label={t('chat.voiceInput')}
            >
              {recording ? <MicOff /> : <Mic />}
            </Button>
            <Textarea
              rows={2}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={recording ? t('chat.voiceInput') : t('chat.placeholder')}
              className="max-h-40 resize-none"
            />
            <Button size="icon" className="size-11 shrink-0" onClick={send} disabled={loading || !input.trim()} aria-label={t('chat.send')}>
              {loading ? <Loader2 className="animate-spin" /> : <Send className="rtl:rotate-180" />}
            </Button>
          </div>
        </div>
      </div>
      </BlurFade>
    </div>
  )
}
