/**
 * Shared SEO source of truth. The frontend uses it for canonical/JSON-LD, the
 * Worker uses it for per-host robots.txt and sitemap.xml, and the build script
 * uses it to emit static fallbacks.
 */

export const DOMAINS = {
  'solutions.com.ly': {
    label: 'Solutions',
    defaultTool: 'solutions',
    description: 'The complete AI workspace for chat, research, code generation and website building.',
  },
  'chat.com.ly': {
    label: 'Solutions Chat',
    defaultTool: 'chat',
    description: 'A focused AI chat with saved sessions, voice input and multilingual answers.',
  },
  'browser.com.ly': {
    label: 'Solutions Browser',
    defaultTool: 'browser',
    description: 'Explore Wikipedia and the Internet Archive with AI summaries — no API key needed.',
  },
  'com.net.ly': {
    label: 'Solutions Code',
    defaultTool: 'code',
    description: 'Turn a simple idea into working code with a two-step enhance and generate workflow.',
  },
  'bot.com.ly': {
    label: 'Solutions Bot',
    defaultTool: 'bot',
    description: 'Describe a website, inject images and refine the result with a live preview.',
  },
}

export const SEO_PAGES = [
  { path: '/', tool: 'solutions', title: 'AI Workspace', description: 'One platform for AI chat, browsing, code generation and website building.' },
  { path: '/chat', tool: 'chat', title: 'AI Chat', description: 'Chat with AI in English or Arabic, with sessions, Markdown and voice support.' },
  { path: '/browser', tool: 'browser', title: 'AI Browser', description: 'Search Wikipedia and the Internet Archive, then summarize sources with AI.' },
  { path: '/code', tool: 'code', title: 'Code Generator', description: 'Enhance your idea, generate code, preview it live, copy and edit it.' },
  { path: '/bot', tool: 'bot', title: 'AI Website Builder', description: 'Build responsive websites from a prompt with image injection and live preview.' },
  { path: '/guide', tool: 'guide', title: 'Models & Fair Use', description: 'Understand the free lane, BYOK keys, quotas and fair-use rules.' },
  { path: '/articles', tool: 'articles', title: 'Articles & Insights', description: 'Read bilingual articles about AI models, privacy, credits, code generation and website building.' },
  { path: '/plans', tool: 'guide', title: 'Free Plan & BYOK', description: 'Compare the shared free pool with bring-your-own-key plans.' },
  { path: '/providers', tool: 'guide', title: 'AI Provider Policies', description: 'How Cloudflare, Groq, OpenRouter and other providers handle prompts and training.' },
  { path: '/privacy', tool: 'guide', title: 'Privacy', description: 'Keys stay in your browser; shared requests run without data training.' },
  { path: '/faq', tool: 'guide', title: 'API Key FAQ', description: 'Step-by-step Groq and OpenRouter key setup in English and Arabic.' },
  { path: '/about', tool: 'solutions', title: 'About', description: 'One premium AI platform serving five dedicated domains.' },
]

export function normalizeHost(hostname = '') {
  return hostname.toLowerCase().replace(/^www\./, '').trim()
}

export function domainConfig(hostname) {
  const host = normalizeHost(hostname)
  return DOMAINS[host] ?? DOMAINS['solutions.com.ly']
}

export function domainHost(hostname) {
  const host = normalizeHost(hostname)
  return DOMAINS[host] ? host : 'solutions.com.ly'
}

export function pageForPath(pathname = '/') {
  const clean = pathname.replace(/\/+$/, '') || '/'
  return SEO_PAGES.find((page) => page.path === clean) ?? SEO_PAGES[0]
}

export function toolForPath(pathname = '/') {
  return pageForPath(pathname).tool
}

export function hasToolPath(pathname = '/') {
  const clean = pathname.replace(/\/+$/, '') || '/'
  return SEO_PAGES.some((page) => page.path === clean && page.path !== '/')
}

export function pathForTool(tool) {
  const page = SEO_PAGES.find((item) => item.tool === tool)
  return page?.path ?? '/'
}

export function seoMeta(hostname, pathname = '/') {
  const host = domainHost(hostname)
  const config = DOMAINS[host]
  const page = pageForPath(pathname)
  const isRoot = page.path === '/'

  return {
    host,
    url: `https://${host}${page.path}`,
    title: isRoot ? `${config.label} — Premium AI Workspace` : `${page.title} | ${config.label}`,
    description: `${page.description} ${config.description}`,
    applicationName: config.label,
  }
}

function xmlEscape(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}

export function sitemapXml(hostname) {
  const host = domainHost(hostname)
  const config = DOMAINS[host]
  const entries = SEO_PAGES.map((page) => {
    const isRoot = page.path === '/'
    const title = isRoot
      ? `${config.label} — Premium AI Workspace`
      : `${page.title} | ${config.label}`
    const description = isRoot ? config.description : page.description
    return `  <url>\n    <loc>https://${host}${page.path}</loc>\n    <title>${xmlEscape(title)}</title>\n    <description>${xmlEscape(description)}</description>\n    <changefreq>weekly</changefreq>\n    <priority>${isRoot ? '1.0' : '0.7'}</priority>\n  </url>`
  }).join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>\n`
}

export function robotsTxt(hostname) {
  const host = domainHost(hostname)
  return `User-agent: *\nAllow: /\nDisallow: /api/\nSitemap: https://${host}/sitemap.xml\n`
}
