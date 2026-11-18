/**
 * Version 1 of AI browsing uses two free, keyless public APIs:
 *   - Wikipedia (MediaWiki + REST summary)
 *   - Internet Archive (advanced search + Wayback availability)
 * No search API key, no backend, no cost.
 */

const WIKI_LANGS = ['en', 'ar', 'fr', 'es', 'de']

export function normalizeWikiLang(lang) {
  return WIKI_LANGS.includes(lang) ? lang : 'en'
}

function looksLikeUrl(query) {
  return /^(https?:\/\/|www\.)/i.test(query.trim()) || /^[\w-]+(\.[\w-]+)+/.test(query.trim())
}

export async function searchWikipedia(query, lang = 'en', signal) {
  const wikiLang = normalizeWikiLang(lang)
  const url = new URL(`https://${wikiLang}.wikipedia.org/w/api.php`)
  url.searchParams.set('action', 'query')
  url.searchParams.set('list', 'search')
  url.searchParams.set('srsearch', query)
  url.searchParams.set('srlimit', '5')
  url.searchParams.set('format', 'json')
  url.searchParams.set('origin', '*')

  const response = await fetch(url, { signal })
  if (!response.ok) throw new Error(`Wikipedia HTTP ${response.status}`)

  const data = await response.json()
  return (data.query?.search ?? []).map((item) => ({
    id: `wiki-${item.pageid}`,
    source: 'wikipedia',
    title: item.title,
    snippet: decodeEntities(item.snippet),
    url: `https://${wikiLang}.wikipedia.org/?curid=${item.pageid}`,
    lang: wikiLang,
  }))
}

export async function getWikipediaSummary(title, lang = 'en', signal) {
  const wikiLang = normalizeWikiLang(lang)
  const url = `https://${wikiLang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title.replace(/ /g, '_'))}`

  const response = await fetch(url, { signal })
  if (!response.ok) throw new Error(`Wikipedia summary HTTP ${response.status}`)

  const data = await response.json()
  return {
    title: data.title,
    extract: data.extract ?? '',
    url: data.content_urls?.desktop?.page ?? `https://${wikiLang}.wikipedia.org/`,
    thumbnail: data.thumbnail?.source ?? null,
  }
}

function decodeEntities(text) {
  return String(text ?? '')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/<[^>]+>/g, '')
}

export async function searchInternetArchive(query, signal) {
  const url = new URL('https://archive.org/advancedsearch.php')
  url.searchParams.set('q', query)
  url.searchParams.set('fl[]', 'identifier')
  url.searchParams.set('fl[]', 'title')
  url.searchParams.set('fl[]', 'description')
  url.searchParams.set('rows', '5')
  url.searchParams.set('page', '1')
  url.searchParams.set('output', 'json')

  const response = await fetch(url, { signal })
  if (!response.ok) throw new Error(`Archive HTTP ${response.status}`)

  const data = await response.json()
  return (data.response?.docs ?? [])
    .filter((item) => item.identifier)
    .map((item, index) => ({
      id: `archive-${item.identifier ?? index}`,
      source: 'archive',
      title: decodeEntities(item.title ?? item.identifier),
      snippet: decodeEntities(
        Array.isArray(item.description)
          ? item.description.slice(0, 2).join(' ')
          : item.description,
      ).slice(0, 240),
      url: `https://archive.org/details/${item.identifier}`,
    }))
}

export async function getWaybackSnapshot(target, signal) {
  const url = new URL('https://archive.org/wayback/available')
  url.searchParams.set('url', target.startsWith('http') ? target : `https://${target}`)

  const response = await fetch(url, { signal })
  if (!response.ok) throw new Error(`Wayback HTTP ${response.status}`)

  const data = await response.json()
  const snapshot = data.archived_snapshots?.closest
  if (!snapshot?.available) return null

  return {
    id: `wayback-${snapshot.timestamp}`,
    source: 'wayback',
    title: target,
    snippet: `Snapshot captured ${snapshot.timestamp}`,
    url: snapshot.url.replace('http://', 'https://'),
    timestamp: snapshot.timestamp,
  }
}

/** Combines the sources into one result list for the Browser tool. */
export async function browse({ query, lang = 'en', signal }) {
  const trimmed = query.trim()
  if (!trimmed) return []

  const jobs = []

  if (looksLikeUrl(trimmed)) {
    jobs.push(getWaybackSnapshot(trimmed, signal).then((item) => (item ? [item] : [])))
  } else {
    jobs.push(searchWikipedia(trimmed, lang, signal))
    jobs.push(searchInternetArchive(trimmed, signal))
  }

  const groups = await Promise.allSettled(jobs)
  return groups.flatMap((group) => (group.status === 'fulfilled' ? group.value : []))
}

export async function summarizeSource(item, lang = 'en', signal) {
  if (item.source === 'wikipedia') {
    const summary = await getWikipediaSummary(item.title, item.lang ?? lang, signal)
    return summary.extract
  }
  return item.snippet
}
