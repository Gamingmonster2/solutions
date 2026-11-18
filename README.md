# Solutions — one platform, five domains

A single `Vite + React` application that powers every AI domain:

| Domain | Opens |
| --- | --- |
| `solutions.com.ly` | Solutions hub |
| `chat.com.ly` | AI Chat |
| `browser.com.ly` | AI Browser |
| `com.net.ly` | Code Generator |
| `bot.com.ly` | AI Website Builder |

All domains share one build, one brand, one identity system and the same three themes (`default`, `dark`, `beige`). The hostname only decides which tool opens first; visitors can switch tools from the header at any time. Every tool is also reachable on every domain by path (for example `/chat`, `/code`).

## Features

- **Shared free lane** — Cloudflare Workers AI through our Worker. No key is exposed to the browser, no signup, no data training.
- **BYOK lane** — Groq and OpenRouter keys are kept in `localStorage` and call the provider directly from the browser. BYOK requests never touch our Worker and do not consume the free quota.
- **Free-first model picker** — shared free models are listed first with their credit cost; BYOK models are locked until the matching key is added, with direct "get key" links.
- **Optional image keys** — Pexels (rich chat answers) and Pixabay (website-builder visual mode), also stored only in the browser.
- **AI Chat** — saved sessions, Markdown rendering, text-to-speech, speech recognition and contextual images.
- **AI Browser (v1)** — completely keyless Wikipedia + Internet Archive search, Wayback snapshots and optional AI summaries.
- **Code Generator** — the original two-step "enhance idea → generate code" flow with preview, copy and inline editing.
- **AI Website Builder** — live iframe preview, code view, device sizes, image injection, iterative refinement, copy/download/open.
- **Paid credits (direct USDC/Polygon)** — self-custody checkout to the owner's wallet, unique micro-USDC amount per invoice, no card processor/webhook/private key; credits are credited on-chain and consumed before the free daily quota. See [docs/PAYMENTS.md §11](docs/PAYMENTS.md).
- **Public guide page** (`/guide`) — EN/AR explanation of plans, quotas, fair use, provider policies, key setup and the roadmap.
- **Premium design system** — Sora display / Plus Jakarta Sans UI / IBM Plex Sans Arabic for RTL, shadcn/ui primitives and Magic UI accents, generous spacing and three themes.
- **Bilingual EN/AR** with full RTL support.

## Free quota & cost math

The shared lane uses a **credit** system so expensive models cost more. The cap is **10 credits per visitor per day**, resetting at **00:00 UTC** (enforced by KV in the Worker and mirrored locally for the indicator).

| Shared model | Worker ID | Credits |
| --- | --- | --- |
| Granite 4 Micro | `@cf/ibm-granite/granite-4.0-h-micro` | 1 |
| GPT-OSS 20B | `@cf/openai/gpt-oss-20b` | 1 |
| Qwen 2.5 Coder 32B | `@cf/qwen/qwen2.5-coder-32b-instruct` | 2 |
| GPT-OSS 120B | `@cf/openai/gpt-oss-120b` | 3 |

Paid USDC credits are consumed **before** the daily free quota and are not capped by it. Plans: `5$ → 100`, `10$ → 250`, `25$ → 700`. The Worker never holds funds; see [docs/PAYMENTS.md §11](docs/PAYMENTS.md).

**What do 100 visitors / 100 active users cost?** Normally **$0**. Cloudflare includes **10,000 Neurons/day** free on Workers AI, which covers 100 users on the 1-credit model. Overage (Workers Paid) is about **$0.011 per 1,000 Neurons**. Surprise bills are prevented by the per-visitor cap, fair-use rules and the BYOK escape hatch. See [docs/FAIR_USE.md](docs/FAIR_USE.md).

## Providers & data policy

We never put a provider that trains on prompts into the default free pool.

| Provider | Status | Training |
| --- | --- | --- |
| Cloudflare Workers AI | Shared free lane | No — zero data retention |
| Groq | BYOK | No |
| OpenRouter free models | BYOK | Opt-in only — strict `data_collection: "deny"` by default |
| Google Gemini unpaid, Mistral Experiment, Cohere free, Cerebras | Not enabled | See [docs/AI_PROVIDERS.md](docs/AI_PROVIDERS.md) |

OpenRouter's data-sharing switch is **off by default**, stored locally as `solutions_data_sharing`, and resets to `deny` when the key is removed. Removing the key also clears the cached free-model list.

## Local development

```bash
npm install
cp .env.example .env
npm run dev
```

The Vite dev server proxies `/api/ai` to `http://localhost:8787/ai`. Start the Worker in another terminal:

```bash
npx wrangler dev --config worker/wrangler.jsonc
```

Useful scripts:

```bash
npm run lint          # ESLint (0 errors / 0 warnings)
npm run build         # regenerate SEO files, then vite build
npm run seo:generate  # regenerate public/robots.txt, sitemap.xml and per-domain sitemaps only
```

## Deploy

### 1. Create the KV namespace

```bash
npx wrangler kv namespace create SOLUTIONS_QUOTA --config worker/wrangler.jsonc
```

Copy the returned `id` into `worker/wrangler.jsonc` under `kv_namespaces[0].id` (currently the `REPLACE_WITH_YOUR_KV_NAMESPACE_ID` placeholder).

### 2. Deploy the Worker

```bash
npm run deploy:worker
```

Set `VITE_WORKER_URL` to the deployed Worker origin before building the frontend:

```bash
VITE_WORKER_URL=https://solutions-ai-worker.<subdomain>.workers.dev npm run build
```

### 3. Route SEO files to the Worker

On Cloudflare, add routes for each domain ahead of the Pages project:

- `solutions.com.ly/robots.txt` → Worker
- `solutions.com.ly/sitemap.xml` → Worker
- …and the same two routes for `chat.com.ly`, `browser.com.ly`, `com.net.ly`, `bot.com.ly`

The Worker generates `robots.txt` and `sitemap.xml` from the request host using `src/config/seo.js`, so each domain gets its own canonical sitemap. Static fallbacks are written to `public/` by `npm run seo:generate`.

### 4. Deploy the frontend and point the domains

Deploy `dist/` to Cloudflare Pages (or any static host), then add all five domains as custom domains on the same Pages project. No code changes are needed — routing is based on `window.location.hostname`. Keep `public/_redirects` (`/* /index.html 200`) so path routes work on refresh.

## Authentication (Cloudflare D1 + Workers)

Lightweight auth lives in the same Worker — no external service. Passwords are hashed with **PBKDF2-SHA256 (100k iterations)** via Web Crypto; session tokens are 32 random bytes, stored in D1 as SHA-256 digests and sent to the browser as an HttpOnly cookie **and** a Bearer token (Bearer is primary because `com.ly` is a public suffix, so a shared `Domain=.com.ly` cookie is unreliable).

Endpoints: `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`.

Schema: `worker/schema.sql` (`users`, `sessions`, `user_quotas`, plus payment tables `invoices`, `invoice_events`, `credit_grants`, `credit_grant_applications`, `paid_credits`). Logged-in visitors get their free daily quota from `user_quotas` in D1; guests keep the KV/IP cap. Paid credits live in `paid_credits` and are spent first. The public suffix caveat and the auth UI (`AccountButton` + `AuthDialog`) are wired into the header.

### One-time setup in the terminal

```bash
cd C:\com.net.ly\solutions

# 1. Create the D1 database (copy the returned database_id into worker/wrangler.jsonc)
npx wrangler d1 create solutions_auth --config worker/wrangler.jsonc

# 2. Apply the schema locally (for `wrangler dev`)
npx wrangler d1 execute solutions_auth --local --config worker/wrangler.jsonc --file=worker/schema.sql

# 3. Apply the schema to production
npx wrangler d1 execute solutions_auth --remote --config worker/wrangler.jsonc --file=worker/schema.sql

# 4. Deploy the Worker with the D1 binding
npm run deploy:worker
```

Replace `REPLACE_WITH_YOUR_D1_DATABASE_ID` in `worker/wrangler.jsonc` after step 1 (and `REPLACE_WITH_YOUR_KV_NAMESPACE_ID` for the quota KV).

### USDC/Polygon checkout setup

The Worker config already contains the receiving wallet, native USDC contract, RPC list, `64` confirmations, and a `*/3 * * * *` cron trigger. Production checks:

```bash
# Optional: enable the guarded manual rescan endpoint (POST /pay/scan)
npx wrangler secret put PAY_ADMIN_TOKEN --config worker/wrangler.jsonc

# Apply the payment tables (already included in worker/schema.sql)
npx wrangler d1 execute solutions_auth --remote --config worker/wrangler.jsonc --file=worker/schema.sql

npm run deploy:worker
```

Receiving address: `0xc6240d79d9341d6e585ca1ddb9b121c8c8a130d4` (EVM/Polygon, from donatr.ee/sayfe). Contract: `0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359`. The Worker only reads public chain data; it holds no private key and receives no webhook. Customers must send the exact micro-USDC amount shown in the invoice — the decimals are the invoice ID. Full architecture and test results: [docs/PAYMENTS.md §11](docs/PAYMENTS.md).

## SEO

`src/config/seo.js` is the single source of truth for 11 public routes per domain (`/`, `/chat`, `/browser`, `/code`, `/bot`, `/guide`, `/plans`, `/providers`, `/privacy`, `/faq`, `/about` = **55 indexable URLs** across 5 domains). `App.jsx` updates canonical, meta, OG, hreflang and JSON-LD from it per host and path. See [docs/SEO.md](docs/SEO.md).

## Model registry

Models live in `src/config/models.js`. Deprecated IDs are retired in one place and `fallbackFor()` quietly moves users to a working sibling. The dead `llama-3.3-70b-versatile` is intentionally not used.

## Roadmap: auth & monetization

Guests keep a small free trial. Signup now gives each person a persistent D1 quota and account. **Paid credits via direct USDC/Polygon are implemented locally** — no card processor, no webhook, no private key; funds go straight to the owner's self-custody wallet. Card checkout (Visa/Mastercard) remains deferred because mainstream on-ramps exclude Libya; no card processor or card fees are published. Engineering constraints, decision gates and test results: [docs/PAYMENTS.md](docs/PAYMENTS.md), status in [docs/ROADMAP.md](docs/ROADMAP.md).

## Notes

- The old `gsk_XXXX...` keys in `chat.txt` were placeholders and were never copied.
- The Worker only accepts the shared `@cf/...` models; BYOK model IDs are never proxied.
- Free quota errors use stable codes: `3036` (quota), `3040` (capacity), `5035` (paid/insufficient credits), `3042` (retired model), `5007` (invalid request), plus `401/402/403/429` and `NO_GROQ_KEY` / `NO_OPENROUTER_KEY`.
- Lighthouse (local preview): Accessibility **100**, Best Practices **100**, SEO **100**.
