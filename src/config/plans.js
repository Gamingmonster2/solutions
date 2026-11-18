/**
 * Paid credits — single source of truth for the Worker and the browser.
 *
 * Settlement is direct to the owner's self-custody wallet. There is no payment
 * provider, no private key in the Worker, and no webhook to trust: the Worker
 * only READS public chain data and matches a unique USDC amount per invoice.
 *
 * Circle's native Polygon PoS USDC contract:
 * https://developers.circle.com/stablecoins/usdc-contract-addresses
 */

export const PAYMENT_NETWORK = {
  chain: 'polygon',
  chainLabel: { en: 'Polygon PoS', ar: 'بوليغون PoS' },
  coin: 'USDC',
  decimals: 6,
  contract: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',
  // Owner's EVM address from donatr.ee/sayfe — same address on Polygon.
  // Override with the PAY_RECEIVE_ADDRESS Worker var if the wallet changes.
  receiveAddress: '0xc6240d79d9341d6e585ca1ddb9b121c8c8a130d4',
  explorer: 'https://polygonscan.com',
  confirmations: 64,
  quoteWindowMs: 15 * 60 * 1000,
  acceptWindowMs: 24 * 60 * 60 * 1000,
  // The 4-digit micro-USDC suffix is what makes each invoice unique. Any
  // tolerance would overlap neighbouring invoices, so the amount must match
  // exactly. USDC itself has 6 decimals and gas is paid separately in POL.
  underpaymentTolerance: 0,
  nonceDigits: 4,
}

export const PAY_PLANS = [
  {
    id: 'starter',
    priceUsd: 5,
    credits: 100,
    name: { en: 'Starter', ar: 'المبتدئ' },
    popular: false,
  },
  {
    id: 'plus',
    priceUsd: 10,
    credits: 250,
    name: { en: 'Plus', ar: 'الإضافي' },
    popular: true,
  },
  {
    id: 'pro',
    priceUsd: 25,
    credits: 700,
    name: { en: 'Pro', ar: 'الاحترافي' },
    popular: false,
  },
]

export const PLAN_BY_ID = Object.fromEntries(PAY_PLANS.map((plan) => [plan.id, plan]))

/** Price in USDC micro-units (6 decimals), as a BigInt-safe string. */
export function planBaseMinor(plan) {
  return (BigInt(Math.round(plan.priceUsd * 1_000_000))).toString()
}

/** Display a 6-decimal micro-unit amount without trailing zeros. */
export function formatUsdc(minor) {
  const digits = String(minor).padStart(PAYMENT_NETWORK.decimals + 1, '0')
  const whole = digits.slice(0, -PAYMENT_NETWORK.decimals)
  const fraction = digits.slice(-PAYMENT_NETWORK.decimals).replace(/0+$/, '')
  return fraction ? `${whole}.${fraction}` : `${whole}.0`
}

export function explorerTxUrl(hash, explorer = PAYMENT_NETWORK.explorer) {
  return `${explorer}/tx/${hash}`
}

export function explorerAddressUrl(address, explorer = PAYMENT_NETWORK.explorer) {
  return `${explorer}/address/${address}`
}
