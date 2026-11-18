/**
 * Direct USDC/Polygon checkout to the owner's self-custody wallet.
 *
 * No payment provider, no private key, no webhook. The Worker only READS public
 * chain data: each invoice gets a unique micro-USDC amount, and a matching
 * incoming Transfer event to the owner's address grants credits once.
 *
 * Treat every value returned by the chain as untrusted input. Amounts are
 * compared as BigInt minor units; credits are granted through an idempotent
 * ledger insert so a repeated scan can never double-credit.
 */

import {
  PAYMENT_NETWORK, PAY_PLANS, PLAN_BY_ID, planBaseMinor,
  formatUsdc, explorerTxUrl, explorerAddressUrl,
} from '../src/config/plans.js'

const TRANSFER_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'
const EVM_ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/
const DEFAULT_RPCS = [
  'https://polygon-bor-rpc.publicnode.com',
  'https://polygon-rpc.com',
  'https://rpc.ankr.com/polygon',
]
const MAX_SCAN_BLOCKS = 5000

export function payError(code, message, status = 400) {
  return Object.assign(new Error(message), { code, status })
}

export function paySettings(env) {
  const receiveAddress = String(env.PAY_RECEIVE_ADDRESS || PAYMENT_NETWORK.receiveAddress).trim()
  const confirmations = Math.min(1000, Math.max(1, Number(env.PAY_CONFIRMATIONS) || PAYMENT_NETWORK.confirmations))
  const scanBlocks = Math.min(MAX_SCAN_BLOCKS, Math.max(1, Number(env.PAY_SCAN_BLOCKS) || 2000))
  const configured = String(env.POLYGON_RPC_URL || '')
    .split(',').map((item) => item.trim()).filter(Boolean)

  return {
    ...PAYMENT_NETWORK,
    receiveAddress,
    confirmations,
    scanBlocks,
    rpcUrls: configured.length ? configured : DEFAULT_RPCS,
    ready: EVM_ADDRESS_RE.test(receiveAddress),
  }
}

export function publicPlans(cfg) {
  return {
    ready: cfg.ready,
    network: {
      chain: cfg.chain,
      chainLabel: cfg.chainLabel,
      coin: cfg.coin,
      contract: cfg.contract,
      decimals: cfg.decimals,
      receiveAddress: cfg.receiveAddress,
      confirmations: cfg.confirmations,
      explorer: cfg.explorer,
      quoteWindowMs: cfg.quoteWindowMs,
      acceptWindowMs: cfg.acceptWindowMs,
      underpaymentTolerance: cfg.underpaymentTolerance,
    },
    plans: PAY_PLANS.map((plan) => ({
      id: plan.id,
      name: plan.name,
      priceUsd: plan.priceUsd,
      credits: plan.credits,
      popular: Boolean(plan.popular),
    })),
  }
}

/* ------------------------------- pure helpers ------------------------------ */

export function padAddress(address) {
  return `0x${String(address).replace(/^0x/i, '').toLowerCase().padStart(64, '0')}`
}

export function decodeUint256(data) {
  const hex = String(data ?? '').replace(/^0x/i, '')
  if (!hex || hex.length > 64 || !/^[0-9a-f]+$/i.test(hex)) return null
  return BigInt(`0x${hex}`)
}

/**
 * Match exactly. The unique 4-digit micro-USDC suffix is the invoice identity;
 * even a 0.1% tolerance would overlap neighbouring amounts and misattribute
 * payments. USDC has 6 decimals and POL gas is paid separately.
 */
export function amountMatches(paidMinor, expectedMinor) {
  return BigInt(paidMinor) === BigInt(expectedMinor)
}

export function logFromAddress(log) {
  return `0x${String(log?.topics?.[1] ?? '').slice(-40).toLowerCase()}`
}

/* ---------------------------------- chain --------------------------------- */

async function rpcCall(cfg, method, params) {
  let lastError = null
  for (const url of cfg.rpcUrls) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
        signal: AbortSignal.timeout(8000),
      })
      if (!response.ok) throw new Error(`RPC HTTP ${response.status}`)
      const data = await response.json()
      if (data?.error) throw new Error(data.error.message ?? 'RPC error')
      return data.result
    } catch (error) {
      lastError = error
    }
  }
  throw payError('PAY_RPC_UNAVAILABLE', `Polygon RPC unavailable: ${String(lastError?.message ?? lastError)}`, 503)
}

async function latestBlock(cfg) {
  const value = parseInt(await rpcCall(cfg, 'eth_blockNumber', []), 16)
  if (!Number.isFinite(value)) {
    throw payError('PAY_RPC_UNAVAILABLE', 'Polygon RPC returned an invalid block number', 503)
  }
  return value
}

/* ----------------------------------- D1 ----------------------------------- */

async function addEvent(env, invoiceId, type, payload) {
  await env.DB.prepare(
    'INSERT INTO invoice_events (id, invoice_id, type, payload, created_at) VALUES (?, ?, ?, ?, ?)',
  ).bind(crypto.randomUUID(), invoiceId, type, JSON.stringify(payload), new Date().toISOString()).run()
}

function publicInvoice(invoice, cfg, paidRemaining = 0) {
  return {
    id: invoice.id,
    status: invoice.status,
    planId: invoice.plan_id,
    credits: Number(invoice.credits),
    priceUsd: Number(invoice.price_usd_minor) / 1_000_000,
    amount: formatUsdc(invoice.pay_amount),
    amountMinor: String(invoice.pay_amount),
    address: invoice.receive_address,
    chain: invoice.chain,
    coin: invoice.coin,
    contract: invoice.token_contract,
    explorerAddressUrl: explorerAddressUrl(invoice.receive_address, cfg.explorer),
    explorerTxUrl: invoice.tx_hash ? explorerTxUrl(invoice.tx_hash, cfg.explorer) : null,
    txHash: invoice.tx_hash ?? null,
    paidAmount: invoice.paid_amount ? formatUsdc(invoice.paid_amount) : null,
    createdAt: invoice.created_at,
    quoteExpiresAt: invoice.quote_expires_at,
    acceptUntil: invoice.accept_until,
    confirmations: cfg.confirmations,
    paidRemaining,
  }
}

async function readPaidCredits(env, userId) {
  const row = await env.DB.prepare(
    'SELECT remaining, lifetime_granted FROM paid_credits WHERE user_id = ?',
  ).bind(userId).first()
  return {
    remaining: Number(row?.remaining ?? 0),
    lifetimeGranted: Number(row?.lifetime_granted ?? 0),
  }
}

export async function accountPlan(env, user, freeLimit) {
  const paid = await readPaidCredits(env, user.id)
  const date = new Date().toISOString().slice(0, 10)
  const quota = await env.DB.prepare(
    'SELECT used FROM user_quotas WHERE user_id = ? AND date = ?',
  ).bind(user.id, date).first()
  return {
    paidCredits: paid.remaining,
    lifetimeGranted: paid.lifetimeGranted,
    free: { used: Number(quota?.used ?? 0), limit: freeLimit },
  }
}

/* --------------------------------- invoices -------------------------------- */

export async function createInvoice(env, cfg, user, planId) {
  if (!cfg.ready) {
    throw payError('PAY_NOT_READY', 'Owner wallet is not configured', 503)
  }
  const plan = PLAN_BY_ID[String(planId ?? '')]
  if (!plan) throw payError('PAY_PLAN', 'Unknown plan', 400)

  const block = await latestBlock(cfg)
  const base = BigInt(planBaseMinor(plan))
  const maxNonce = 10 ** PAYMENT_NETWORK.nonceDigits
  const now = Date.now()

  // The 4-digit suffix makes every invoice amount unique so a payment can be
  // attributed to exactly one account even with simultaneous checkouts.
  for (let attempt = 0; attempt < 16; attempt += 1) {
    const nonce = BigInt(crypto.getRandomValues(new Uint32Array(1))[0] % maxNonce)
    const amount = (base + nonce).toString()
    const id = crypto.randomUUID()
    try {
      await env.DB.prepare(
        `INSERT INTO invoices (
          id, user_id, plan_id, price_usd_minor, credits, pay_amount, receive_address,
          chain, coin, token_contract, created_at, quote_expires_at, accept_until,
          created_block, last_scanned_block, last_check_at, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      ).bind(
        id,
        user.id,
        plan.id,
        planBaseMinor(plan),
        plan.credits,
        amount,
        cfg.receiveAddress,
        cfg.chain,
        cfg.coin,
        cfg.contract,
        new Date(now).toISOString(),
        new Date(now + cfg.quoteWindowMs).toISOString(),
        new Date(now + cfg.acceptWindowMs).toISOString(),
        block,
        Math.max(0, block - 5),
        null,
      ).run()

      await addEvent(env, id, 'created', { planId: plan.id, credits: plan.credits, amountMinor: amount })
      const paid = await readPaidCredits(env, user.id)
      return publicInvoice(
        await env.DB.prepare('SELECT * FROM invoices WHERE id = ?').bind(id).first(),
        cfg,
        paid.remaining,
      )
    } catch (error) {
      if (/UNIQUE constraint/i.test(String(error?.message ?? error))) continue
      throw error
    }
  }
  throw payError('PAY_AMOUNT_COLLISION', 'Could not allocate a unique amount. Please retry.', 503)
}

export async function invoiceStatus(env, cfg, user, invoiceId) {
  const invoice = await env.DB.prepare(
    'SELECT * FROM invoices WHERE id = ? AND user_id = ?',
  ).bind(String(invoiceId ?? ''), user.id).first()

  if (!invoice) throw payError('PAY_NOT_FOUND', 'Invoice not found', 404)

  // On-demand check for the polling dialog, throttled to 10s per invoice.
  // The cron handler is the authoritative scanner.
  if (invoice.status === 'pending') {
    const lastCheck = Date.parse(invoice.last_check_at ?? '') || 0
    if (Date.now() - lastCheck > 10_000) {
      await env.DB.prepare('UPDATE invoices SET last_check_at = ? WHERE id = ?')
        .bind(new Date().toISOString(), invoice.id).run()
      try {
        await scanPending(env, cfg, invoice.id)
      } catch {
        // A temporary RPC failure must not break the status view.
      }
    }
  }

  const fresh = await env.DB.prepare('SELECT * FROM invoices WHERE id = ?').bind(invoice.id).first()
  const paid = await readPaidCredits(env, user.id)
  return publicInvoice(fresh, cfg, paid.remaining)
}

/* --------------------------------- scanning -------------------------------- */

async function grantCredits(env, invoice) {
  // D1 batch is atomic. A unique token is written with the balance update, so a
  // retry can see whether THIS run applied the grant and never double-credits,
  // even if an older partial run left only a credit_grants row behind.
  const token = crypto.randomUUID()
  const now = new Date().toISOString()
  const credits = Number(invoice.credits)
  const applied = 'EXISTS (SELECT 1 FROM credit_grant_applications WHERE invoice_id = ? AND token = ?)'

  await env.DB.batch([
    env.DB.prepare(
      'INSERT OR IGNORE INTO credit_grants (invoice_id, user_id, credits, created_at) VALUES (?, ?, ?, ?)',
    ).bind(invoice.id, invoice.user_id, credits, now),

    env.DB.prepare(
      'INSERT OR IGNORE INTO credit_grant_applications (invoice_id, token, created_at) VALUES (?, ?, ?)',
    ).bind(invoice.id, token, now),

    env.DB.prepare(
      `INSERT INTO paid_credits (user_id, remaining, lifetime_granted, updated_at)
       SELECT ?, ?, ?, ? WHERE ${applied}
       ON CONFLICT(user_id) DO UPDATE SET
         remaining = remaining + excluded.remaining,
         lifetime_granted = lifetime_granted + excluded.lifetime_granted,
         updated_at = excluded.updated_at`,
    ).bind(invoice.user_id, credits, credits, now, invoice.id, token),

    env.DB.prepare(
      `UPDATE invoices SET status = 'paid', credited_at = ?
       WHERE id = ? AND status = 'detected' AND ${applied}`,
    ).bind(now, invoice.id, invoice.id, token),

    env.DB.prepare(
      `INSERT INTO invoice_events (id, invoice_id, type, payload, created_at)
       SELECT ?, ?, 'credited', ?, ? WHERE ${applied}`,
    ).bind(crypto.randomUUID(), invoice.id, JSON.stringify({ credits }), now, invoice.id, token),
  ])

  // D1 batch results do not reliably expose per-statement changes. The token
  // row itself is the authoritative marker that THIS run applied the grant.
  const marker = await env.DB.prepare(
    'SELECT 1 FROM credit_grant_applications WHERE invoice_id = ? AND token = ?',
  ).bind(invoice.id, token).first()
  return Boolean(marker)
}

export async function scanPending(env, cfg = paySettings(env), onlyInvoiceId = null) {
  if (!cfg.ready || !env.DB) return { detected: 0, credited: 0 }

  const head = await latestBlock(cfg)
  const select = onlyInvoiceId
    ? env.DB.prepare("SELECT * FROM invoices WHERE id = ? AND status = 'pending'").bind(onlyInvoiceId)
    : env.DB.prepare("SELECT * FROM invoices WHERE status = 'pending'")
  const { results } = await select.all()

  let detected = 0
  for (const invoice of results) {
    const created = Number(invoice.created_block) || 0
    const from = Math.max(0, Number(invoice.last_scanned_block ?? created - 5))
    if (from > head) continue
    const to = Math.min(head, from + cfg.scanBlocks - 1)

    try {
      const logs = await rpcCall(cfg, 'eth_getLogs', [{
        address: cfg.contract,
        fromBlock: `0x${from.toString(16)}`,
        toBlock: `0x${to.toString(16)}`,
        topics: [TRANSFER_TOPIC, null, padAddress(cfg.receiveAddress)],
      }])

      await env.DB.prepare('UPDATE invoices SET last_scanned_block = ? WHERE id = ?')
        .bind(to, invoice.id).run()

      for (const log of logs ?? []) {
        const paid = decodeUint256(log?.data)
        if (paid === null || !amountMatches(paid, invoice.pay_amount)) continue

        const block = parseInt(log.blockNumber, 16)
        if (!Number.isFinite(block) || block < Math.max(0, created - 5)) continue

        if (Date.now() > Date.parse(invoice.accept_until)) {
          await addEvent(env, invoice.id, 'late_payment', {
            txHash: log.transactionHash, block, amountMinor: paid.toString(),
          })
          continue
        }

        const updated = await env.DB.prepare(
          `UPDATE invoices SET status = 'detected', tx_hash = ?, payer_address = ?,
           paid_amount = ?, detected_block = ?, detected_at = ?
           WHERE id = ? AND status = 'pending'`,
        ).bind(
          String(log.transactionHash ?? ''),
          logFromAddress(log),
          paid.toString(),
          block,
          new Date().toISOString(),
          invoice.id,
        ).run()

        if (Number(updated.meta?.changes ?? updated.changes ?? 0) > 0) {
          detected += 1
          await addEvent(env, invoice.id, 'detected', {
            txHash: log.transactionHash,
            block,
            amountMinor: paid.toString(),
            confirmations: cfg.confirmations,
          })
          break
        }
      }
    } catch (error) {
      // Keep the cursor unchanged on RPC failure so the next run retries the range.
      await addEvent(env, invoice.id, 'scan_error', { message: String(error?.message ?? error) }).catch(() => {})
    }
  }

  const pendingConfirmation = await env.DB.prepare(
    "SELECT * FROM invoices WHERE status = 'detected'",
  ).all()

  let credited = 0
  for (const invoice of pendingConfirmation.results) {
    const block = Number(invoice.detected_block)
    if (!Number.isFinite(block) || head - block < cfg.confirmations) continue
    if (await grantCredits(env, invoice)) credited += 1
  }

  return { detected, credited }
}
