import { lazy, Suspense, useEffect, useState } from 'react'
import { Toaster } from 'sonner'
import { DEFAULT_TOOL, toolForHost } from '@/config/domains'
import { STORAGE_KEYS } from '@/config/limits'
import { hasToolPath, pathForTool, seoMeta, toolForPath } from '@/config/seo'
import { useSettings } from '@/hooks/useSettings'
import { AuroraBackground } from '@/components/magic/aurora-background'
import { SiteHeader } from '@/components/layout/site-header'
import { SiteFooter } from '@/components/layout/site-footer'

const SolutionsTool = lazy(() => import('@/tools/SolutionsTool.jsx').then((module) => ({ default: module.SolutionsTool })))
const ChatTool = lazy(() => import('@/tools/ChatTool.jsx').then((module) => ({ default: module.ChatTool })))
const BrowserTool = lazy(() => import('@/tools/BrowserTool.jsx').then((module) => ({ default: module.BrowserTool })))
const CodeTool = lazy(() => import('@/tools/CodeTool.jsx').then((module) => ({ default: module.CodeTool })))
const BotTool = lazy(() => import('@/tools/BotTool.jsx').then((module) => ({ default: module.BotTool })))
const SettingsTool = lazy(() => import('@/tools/SettingsTool.jsx').then((module) => ({ default: module.SettingsTool })))
const GuideTool = lazy(() => import('@/tools/GuideTool.jsx').then((module) => ({ default: module.GuideTool })))
const ArticlesTool = lazy(() => import('@/tools/ArticlesTool.jsx').then((module) => ({ default: module.ArticlesTool })))

const TOOL_COMPONENTS = {
  solutions: SolutionsTool,
  chat: ChatTool,
  browser: BrowserTool,
  code: CodeTool,
  bot: BotTool,
  settings: SettingsTool,
  guide: GuideTool,
  articles: ArticlesTool,
}

function initialTool() {
  const hostTool = toolForHost(window.location.hostname)

  // A real path always wins, so /chat works on every domain.
  if (hasToolPath(window.location.pathname)) return toolForPath(window.location.pathname)

  // Each production domain must auto-open its own tool, regardless of what
  // was stored on another domain.
  if (hostTool !== DEFAULT_TOOL) return hostTool

  try {
    const stored = localStorage.getItem(STORAGE_KEYS.activeTool)
    if (stored && TOOL_COMPONENTS[stored]) return stored
  } catch {
    // localStorage can be unavailable in private browsing.
  }
  return DEFAULT_TOOL
}

function upsertMeta(attribute, value, content) {
  let element = document.head.querySelector(`meta[${attribute}="${value}"]`)
  if (!element) {
    element = document.createElement('meta')
    element.setAttribute(attribute, value)
    document.head.appendChild(element)
  }
  element.setAttribute('content', content)
}

function upsertLink(rel, href, hreflang) {
  let element = document.head.querySelector(`link[rel="${rel}"]${hreflang ? `[hreflang="${hreflang}"]` : ''}`)
  if (!element) {
    element = document.createElement('link')
    element.setAttribute('rel', rel)
    if (hreflang) element.setAttribute('hreflang', hreflang)
    document.head.appendChild(element)
  }
  element.setAttribute('href', href)
}

export default function App() {
  const { t, lang } = useSettings()
  const [activeTool, setActiveTool] = useState(initialTool)

  function openTool(next) {
    setActiveTool(next)
    const path = pathForTool(next)
    if (window.location.pathname !== path) {
      window.history.pushState({ tool: next }, '', path)
    }
  }

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.activeTool, activeTool)
  }, [activeTool])

  useEffect(() => {
    function handlePopState() {
      setActiveTool(
        hasToolPath(window.location.pathname)
          ? toolForPath(window.location.pathname)
          : toolForHost(window.location.hostname),
      )
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  useEffect(() => {
    const path = hasToolPath(window.location.pathname)
      ? window.location.pathname
      : pathForTool(activeTool)
    const meta = seoMeta(window.location.hostname, path)

    document.title = meta.title
    upsertMeta('name', 'description', meta.description)
    upsertMeta('property', 'og:title', meta.title)
    upsertMeta('property', 'og:description', meta.description)
    upsertMeta('property', 'og:url', meta.url)
    upsertMeta('name', 'twitter:card', 'summary_large_image')
    upsertLink('canonical', meta.url)
    upsertLink('alternate', `${meta.url}?lang=en`, 'en')
    upsertLink('alternate', `${meta.url}?lang=ar`, 'ar')

    let structured = document.getElementById('solutions-structured-data')
    if (!structured) {
      structured = document.createElement('script')
      structured.id = 'solutions-structured-data'
      structured.type = 'application/ld+json'
      document.head.appendChild(structured)
    }
    structured.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: meta.applicationName,
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      description: meta.description,
      url: meta.url,
      inLanguage: [lang === 'ar' ? 'ar' : 'en'],
    })
  }, [activeTool, lang])

  const ActiveTool = TOOL_COMPONENTS[activeTool] ?? SolutionsTool

  return (
    <AuroraBackground className="flex min-h-screen flex-col">
      <SiteHeader activeTool={activeTool} onToolChange={openTool} />

      <main className="mx-auto w-full max-w-[1500px] flex-1 px-4 py-10 sm:px-6 sm:py-12">
        <Suspense
          fallback={
            <div className="flex min-h-[50vh] items-center justify-center text-sm text-muted-foreground">
              {t('common.loading')}
            </div>
          }
        >
          <ActiveTool onOpenTool={openTool} />
        </Suspense>
      </main>

      <SiteFooter
        onOpenSettings={() => openTool('settings')}
        onOpenGuide={() => openTool('guide')}
      />
      <Toaster position="top-center" richColors closeButton />
    </AuroraBackground>
  )
}
