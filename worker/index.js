/**
 * One Worker for the whole platform:
 *  - /ai          shared free lane (Cloudflare Workers AI + per-visitor quota)
 *  - /auth/*      lightweight auth (Web Crypto PBKDF2 + sessions) backed by D1
 *  - SEO files    per-host robots.txt / sitemap.xml
 *
 * Keys are never proxied; BYOK calls go from the browser straight to providers.
 */

import { domainHost, robotsTxt, sitemapXml } from '../src/config/seo.js'
import {
  accountPlan, createInvoice, invoiceStatus, paySettings,
  publicPlans, scanPending,
} from './pay.js'

const ALLOWED_MODELS = new Set([
  '@cf/ibm-granite/granite-4.0-h-micro',
  '@cf/qwen/qwen2.5-coder-32b-instruct',
  '@cf/openai/gpt-oss-20b',
  '@cf/openai/gpt-oss-120b',
])

const FREE_DAILY_REQUESTS = 10
// Registered accounts use the same cap today; raise this for paid tiers later.
const AUTH_DAILY_REQUESTS = FREE_DAILY_REQUESTS

// Keep in sync with src/config/models.js. Cheaper models give more requests.
const MODEL_COSTS = {
  '@cf/ibm-granite/granite-4.0-h-micro': 1,
  '@cf/openai/gpt-oss-20b': 1,
  '@cf/qwen/qwen2.5-coder-32b-instruct': 2,
  '@cf/openai/gpt-oss-120b': 3,
}

const SESSION_COOKIE = 'solutions_session'
const SESSION_TTL_SECONDS = 30 * 24 * 60 * 60 // 30 days
const PBKDF2_ITERATIONS = 100_000
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

function corsHeaders(request, env) {
  const origin = request.headers.get('Origin')
  const configured = (env.ALLOWED_ORIGINS ?? '').split(',').map((item) => item.trim()).filter(Boolean)
  const allowed = !configured.length || !origin || configured.some((item) => origin === item || origin === `https://${item}`)

  return {
    'Access-Control-Allow-Origin': allowed ? origin ?? '*' : 'https://solutions.com.ly',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  }
}

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...headers },
  })
}

async function readJson(request) {
  try {
    return await request.json()
  } catch {
    return null
  }
}

function providerCode(message) {
  if (/not found|does not exist|invalid model|404/i.test(message)) return '3042'
  if (/paid|premium|billing|plan|upgrade|payment required|insufficient credits|402/i.test(message)) return '5035'
  return '3040'
}

/* ---------------------------------- auth --------------------------------- */

function bytesToHex(bytes) {
  return [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

function randomHex(byteLength) {
  return bytesToHex(crypto.getRandomValues(new Uint8Array(byteLength)))
}

async function hashPassword(password, saltHex) {
  const salt = Uint8Array.from(saltHex.match(/../g) ?? [], (byte) => parseInt(byte, 16))
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  )
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    key,
    256,
  )
  return bytesToHex(bits)
}

/** Constant-time-ish compare, so a wrong password does not leak position. */
function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false
  let diff = 0
  for (let index = 0; index < a.length; index += 1) {
    diff |= a.charCodeAt(index) ^ b.charCodeAt(index)
  }
  return diff === 0
}

async function tokenDigest(token) {
  return bytesToHex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token)))
}

function bearerToken(request) {
  const header = request.headers.get('Authorization') ?? ''
  return header.startsWith('Bearer ') ? header.slice(7).trim() : null
}

function cookieToken(request) {
  const cookie = request.headers.get('Cookie') ?? ''
  return cookie.match(/(?:^|;\s*)solutions_session=([^;]+)/)?.[1] ?? null
}

function sessionCookie(token, maxAge, request, clear = false) {
  const secure = new URL(request.url).protocol === 'https:'
  return [
    `${SESSION_COOKIE}=${clear ? '' : token}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    secure ? 'Secure' : '',
    `Max-Age=${clear ? 0 : maxAge}`,
  ].filter(Boolean).join('; ')
}

function publicUser(row) {
  return { id: row.id, email: row.email, created_at: row.created_at }
}

async function createSession(env, userId) {
  const token = randomHex(32)
  const expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1000).toISOString()
  await env.DB.prepare('INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)')
    .bind(await tokenDigest(token), userId, expiresAt)
    .run()
  return { token, expiresAt }
}

/**
 * Resolves the current session from Bearer (primary, works across all five
 * domains) or HttpOnly cookie. `com.ly` is a public suffix, so a shared
 * Domain=.com.ly cookie is not reliable — that is why Bearer is primary.
 */
async function sessionUser(request, env) {
  if (!env.DB) return null
  const token = bearerToken(request) ?? cookieToken(request)
  if (!token) return null

  const digest = await tokenDigest(token)
  const row = await env.DB.prepare(
    `SELECT u.id, u.email, u.created_at, s.expires_at
       FROM sessions s JOIN users u ON u.id = s.user_id
      WHERE s.token = ?`,
  ).bind(digest).first()

  if (!row) return null

  if (new Date(row.expires_at).getTime() <= Date.now()) {
    await env.DB.prepare('DELETE FROM sessions WHERE token = ?').bind(digest).run().catch(() => {})
    return null
  }

  return publicUser(row)
}

async function readAccountQuota(env, userId, date) {
  const row = await env.DB.prepare(
    'SELECT used FROM user_quotas WHERE user_id = ? AND date = ?',
  ).bind(userId, date).first()
  return Number(row?.used ?? 0)
}

async function writeAccountQuota(env, userId, date, used) {
  await env.DB.prepare(
    `INSERT INTO user_quotas (user_id, date, used, updated_at) VALUES (?, ?, ?, ?)
     ON CONFLICT(user_id, date) DO UPDATE SET used = excluded.used, updated_at = excluded.updated_at`,
  ).bind(userId, date, used, new Date().toISOString()).run()
}

async function authRoutes(request, env, url, headers) {
  const path = url.pathname
  if (!path.startsWith('/auth/')) return null

  if (!env.DB) {
    return json({ error: 'Auth is not configured', code: 'AUTH_NOT_READY' }, 503, headers)
  }

  if (path === '/auth/register' && request.method === 'POST') {
    const body = await readJson(request)
    const email = String(body?.email ?? '').trim().toLowerCase()
    const password = String(body?.password ?? '')

    if (!EMAIL_RE.test(email)) {
      return json({ error: 'Invalid email', code: 'AUTH_EMAIL' }, 400, headers)
    }
    if (password.length < 8 || password.length > 128) {
      return json({ error: 'Password must be 8-128 characters', code: 'AUTH_PASSWORD' }, 400, headers)
    }

    const existing = await env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first()
    if (existing) {
      return json({ error: 'Email already registered', code: 'AUTH_EXISTS' }, 409, headers)
    }

    const id = crypto.randomUUID()
    const salt = randomHex(16)
    const passwordHash = await hashPassword(password, salt)
    const createdAt = new Date().toISOString()

    await env.DB.prepare(
      'INSERT INTO users (id, email, password_hash, salt, created_at) VALUES (?, ?, ?, ?, ?)',
    ).bind(id, email, passwordHash, salt, createdAt).run()

    const { token, expiresAt } = await createSession(env, id)
    return json(
      { user: { id, email, created_at: createdAt }, token, expires_at: expiresAt },
      201,
      { ...headers, 'Set-Cookie': sessionCookie(token, SESSION_TTL_SECONDS, request) },
    )
  }

  if (path === '/auth/login' && request.method === 'POST') {
    const body = await readJson(request)
    const email = String(body?.email ?? '').trim().toLowerCase()
    const password = String(body?.password ?? '')

    const row = await env.DB.prepare(
      'SELECT id, email, password_hash, salt, created_at FROM users WHERE email = ?',
    ).bind(email).first()

    // Do comparable work even when the account does not exist.
    const salt = row?.salt ?? '00000000000000000000000000000000'
    const candidate = await hashPassword(password, salt)
    if (!row || !safeEqual(candidate, row.password_hash)) {
      return json({ error: 'Invalid email or password', code: 'AUTH_INVALID' }, 401, headers)
    }

    const { token, expiresAt } = await createSession(env, row.id)
    return json(
      { user: publicUser(row), token, expires_at: expiresAt },
      200,
      { ...headers, 'Set-Cookie': sessionCookie(token, SESSION_TTL_SECONDS, request) },
    )
  }

  if (path === '/auth/logout' && request.method === 'POST') {
    const token = bearerToken(request) ?? cookieToken(request)
    if (token) {
      await env.DB.prepare('DELETE FROM sessions WHERE token = ?')
        .bind(await tokenDigest(token)).run().catch(() => {})
    }
    return json({ ok: true }, 200, {
      ...headers,
      'Set-Cookie': sessionCookie('', 0, request, true),
    })
  }

  if (path === '/auth/me' && request.method === 'GET') {
    const user = await sessionUser(request, env)
    if (!user) return json({ authenticated: false }, 401, headers)
    return json({ authenticated: true, user }, 200, headers)
  }

  return json({ error: 'Not found', code: '5007' }, 404, headers)
}

/* -------------------------------- payments -------------------------------- */

async function payRoutes(request, env, url, headers) {
  const path = url.pathname
  if (!path.startsWith('/pay/') && path !== '/account/plan') return null
  if (!env.DB) {
    return json({ error: 'Payments are not configured', code: 'PAY_NOT_READY' }, 503, headers)
  }

  const cfg = paySettings(env)

  // Public plan catalog so the dialog can render before sign-in.
  if (path === '/pay/plans' && request.method === 'GET') {
    return json(publicPlans(cfg), 200, headers)
  }

  // Manual rescan for operations. Disabled unless PAY_ADMIN_TOKEN is set.
  if (path === '/pay/scan' && request.method === 'POST') {
    if (!env.PAY_ADMIN_TOKEN || !safeEqual(bearerToken(request) ?? '', env.PAY_ADMIN_TOKEN)) {
      return json({ error: 'Not found', code: '5007' }, 404, headers)
    }
    try {
      return json(await scanPending(env, cfg), 200, headers)
    } catch (error) {
      return json({ error: error.message, code: error.code ?? 'PAY_SCAN_FAILED' }, 503, headers)
    }
  }

  const user = await sessionUser(request, env)
  if (!user) {
    return json({ error: 'Sign in required', code: 'AUTH_REQUIRED' }, 401, headers)
  }

  try {
    if (path === '/pay/invoice' && request.method === 'POST') {
      const body = await readJson(request)
      return json(await createInvoice(env, cfg, user, body?.planId), 201, headers)
    }

    if (path === '/pay/status' && request.method === 'GET') {
      return json(await invoiceStatus(env, cfg, user, url.searchParams.get('invoice')), 200, headers)
    }

    if (path === '/account/plan' && request.method === 'GET') {
      return json(await accountPlan(env, user, AUTH_DAILY_REQUESTS), 200, headers)
    }
  } catch (error) {
    return json(
      { error: error?.message ?? 'Payment request failed', code: error?.code ?? 'PAY_FAILED' },
      error?.status ?? 400,
      headers,
    )
  }

  return json({ error: 'Not found', code: '5007' }, 404, headers)
}

async function visitorId(request) {
  const ip =
    request.headers.get('CF-Connecting-IP') ??
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    'anonymous'

  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(ip))
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('').slice(0, 24)
}

export default {
  async fetch(request, env) {
    const headers = corsHeaders(request, env)

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers })
    }

    const url = new URL(request.url)

    // Per-host SEO files. On Cloudflare, route */robots.txt and */sitemap.xml
    // to this Worker ahead of the Pages project so each domain is indexed
    // independently.
    if (request.method === 'GET') {
      const host = domainHost(url.hostname)
      if (url.pathname === '/robots.txt') {
        return new Response(robotsTxt(host), {
          headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=3600' },
        })
      }
      if (url.pathname === '/sitemap.xml') {
        return new Response(sitemapXml(host), {
          headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=3600' },
        })
      }
    }

    const authResponse = await authRoutes(request, env, url, headers)
    if (authResponse) return authResponse

    const payResponse = await payRoutes(request, env, url, headers)
    if (payResponse) return payResponse

    if (request.method !== 'POST' || url.pathname !== '/ai') {
      return json({ error: 'Not found', code: '5007' }, 404, headers)
    }

    const body = await readJson(request)
    if (!body) {
      return json({ error: 'Invalid JSON body', code: '5007' }, 400, headers)
    }

    const model = body?.model
    if (!ALLOWED_MODELS.has(model)) {
      return json({ error: 'Invalid model', code: '5007' }, 400, headers)
    }
    if (!Array.isArray(body.messages) || body.messages.length === 0) {
      return json({ error: 'Invalid task', code: '5007' }, 400, headers)
    }

    const date = new Date().toISOString().slice(0, 10)
    const user = await sessionUser(request, env)
    const cost = MODEL_COSTS[model] ?? 1
    const now = new Date().toISOString()

    let used
    let limit
    let quotaKey = null
    let source
    let paidRemaining = 0

    if (user) {
      // Paid credits are consumed first, atomically, and ignore the daily cap.
      const paid = await env.DB.prepare(
        'UPDATE paid_credits SET remaining = remaining - ?, updated_at = ? WHERE user_id = ? AND remaining >= ?',
      ).bind(cost, now, user.id, cost).run()
      const paidChanged = Number(paid.meta?.changes ?? paid.changes ?? 0)

      if (paidChanged > 0) {
        source = 'paid'
        limit = null
        used = cost
        const row = await env.DB.prepare('SELECT remaining FROM paid_credits WHERE user_id = ?')
          .bind(user.id).first()
        paidRemaining = Number(row?.remaining ?? 0)
      } else {
        limit = AUTH_DAILY_REQUESTS
        used = await readAccountQuota(env, user.id, date)
        source = 'account'
      }
    } else {
      limit = FREE_DAILY_REQUESTS
      quotaKey = `quota:${date}:${await visitorId(request)}`
      used = Number((await env.QUOTA.get(quotaKey)) ?? 0)
      source = 'visitor'
    }

    if (source !== 'paid' && used + cost > limit) {
      return json(
        {
          error: 'Daily free quota reached',
          code: '3036',
          quota: { used, limit, source, paid_remaining: paidRemaining },
        },
        429,
        headers,
      )
    }

    // Reserve before calling the provider. Paid credits are already reserved
    // by the conditional UPDATE above; guests use KV, free accounts use D1.
    if (source === 'paid') {
      // no extra write
    } else if (user) {
      await writeAccountQuota(env, user.id, date, used + cost)
    } else {
      await env.QUOTA.put(quotaKey, String(used + cost), { expirationTtl: 48 * 60 * 60 })
    }

    const responseUsed = source === 'paid' ? used : used + cost

    try {
      const result = await env.AI.run(model, {
        messages: body.messages,
        max_tokens: Math.min(Math.max(Number(body.max_tokens) || 2048, 1), 8192),
        temperature: 0.2,
      })

      const text =
        typeof result === 'string'
          ? result
          : result?.response ?? result?.result ?? result?.choices?.[0]?.message?.content ?? ''

      return json(
        {
          text,
          model,
          authenticated: Boolean(user),
          quota: { used: responseUsed, limit, source, paid_remaining: paidRemaining },
        },
        200,
        headers,
      )
    } catch (error) {
      const message = String(error?.message ?? error)
      const code = providerCode(message)
      return json({ error: message, code }, code === '3040' ? 503 : 400, headers)
    }
  },

  /** Cron: advance the on-chain cursor for pending invoices and settle confirmed ones. */
  async scheduled(controller, env, ctx) {
    try {
      await scanPending(env)
    } catch (error) {
      console.error('USDC scan failed:', error)
    }
  },
}
