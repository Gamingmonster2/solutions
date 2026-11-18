import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { DOMAINS, robotsTxt, sitemapXml } from '../src/config/seo.js'

const root = path.resolve(import.meta.dirname, '..')
const publicDir = path.join(root, 'public')
const sitemapDir = path.join(publicDir, 'sitemaps')

await mkdir(sitemapDir, { recursive: true })

const hosts = Object.keys(DOMAINS)

const sitemapIndex = `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${hosts
  .map((host) => `  <sitemap>\n    <loc>https://${host}/sitemap.xml</loc>\n  </sitemap>`)
  .join('\n')}\n</sitemapindex>\n`

await writeFile(path.join(publicDir, 'sitemap.xml'), sitemapIndex, 'utf8')
await writeFile(
  path.join(publicDir, 'robots.txt'),
  `User-agent: *\nAllow: /\nDisallow: /api/\n${hosts
    .map((host) => `Sitemap: https://${host}/sitemap.xml`)
    .join('\n')}\n`,
  'utf8',
)
await writeFile(path.join(publicDir, '_redirects'), '/*  /index.html  200\n', 'utf8')

for (const host of hosts) {
  await writeFile(path.join(sitemapDir, `${host}.xml`), sitemapXml(host), 'utf8')
}

console.log(`Generated SEO files for ${hosts.length} domains.`)
