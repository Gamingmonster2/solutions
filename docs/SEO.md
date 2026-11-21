# SEO architecture

## Goal

Each of the five domains must appear independently in Google with its own sitemap and pages. The target is **10+ indexed pages per domain → 40+ pages in search results**.

## Source of truth

`src/config/seo.js` defines:

- `DOMAINS` — label, default tool and description for each host.
- `SEO_PAGES` — 12 public routes: `/`, `/chat`, `/browser`, `/code`, `/bot`, `/guide`, `/articles`, `/plans`, `/providers`, `/privacy`, `/faq`, `/about`.
- `seoMeta()` — host-aware title, description, canonical URL and application name.
- `sitemapXml()` / `robotsTxt()` — per-host XML and text output.

## Frontend

`src/App.jsx` reads `seoMeta()` on every tool/path change and updates:

- `<title>` and `<meta name="description">`
- Open Graph (`og:title`, `og:description`, `og:url`) and `twitter:card`
- `<link rel="canonical">` pointing at the **current host**
- `<link rel="alternate" hreflang="en|ar">`
- `application/ld+json` SoftwareApplication structured data

Because the build is one SPA, `public/_redirects` (`/* /index.html 200`) keeps path routes working on refresh (Cloudflare Pages / Netlify).

## Static fallbacks

`npm run seo:generate` (also run automatically by `npm run build`) writes:

```
public/robots.txt          # lists all five sitemaps
public/sitemap.xml         # sitemap index of the five per-domain sitemaps
public/sitemaps/*.xml      # one 12-URL urlset per domain
public/_redirects
```

## Worker (per-host dynamic)

`worker/index.js` serves `GET /robots.txt` and `GET /sitemap.xml` from the same config, so the response matches the request host even though there is one deployment.

On Cloudflare, add routes for both paths on all five domains **ahead of** the Pages project:

```
solutions.com.ly/robots.txt   -> solutions-ai-worker
solutions.com.ly/sitemap.xml  -> solutions-ai-worker
chat.com.ly/robots.txt        -> solutions-ai-worker
chat.com.ly/sitemap.xml       -> solutions-ai-worker
... etc
```

If these routes are not added, the static `public/` files still serve a valid sitemap index, but each domain will not get its own canonical URL set — so the routes are recommended.

## Verification

After deployment, submit each domain's sitemap in Google Search Console:

```
https://solutions.com.ly/sitemap.xml
https://chat.com.ly/sitemap.xml
https://browser.com.ly/sitemap.xml
https://com.net.ly/sitemap.xml
https://bot.com.ly/sitemap.xml
```

Local Lighthouse (preview build) currently scores **100** on Accessibility, Best Practices and SEO.
