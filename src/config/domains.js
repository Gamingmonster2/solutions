/**
 * One deployment, five hostnames. The hostname only chooses which tool opens
 * first — the brand, theme and language system are shared everywhere.
 */
export const DEFAULT_TOOL = 'solutions'

export const DOMAIN_TO_TOOL = {
  'solutions.com.ly': 'solutions',
  'chat.com.ly': 'chat',
  'browser.com.ly': 'browser',
  'com.net.ly': 'code',
  'bot.com.ly': 'bot',
}

export function normalizeHost(hostname = '') {
  return hostname.toLowerCase().replace(/^www\./, '').trim()
}

export function toolForHost(hostname) {
  const host = normalizeHost(hostname)

  // Local previews and Cloudflare preview URLs all open the main hub.
  if (
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host.endsWith('.pages.dev') ||
    host.endsWith('.workers.dev') ||
    host.endsWith('.vercel.app') ||
    host.endsWith('.netlify.app')
  ) {
    return DEFAULT_TOOL
  }

  return DOMAIN_TO_TOOL[host] ?? DEFAULT_TOOL
}
