import { getAuthToken } from '@/services/auth'

const WORKER_URL = import.meta.env.VITE_WORKER_URL ?? '/api'

function endpoint(path) {
  const base = WORKER_URL.endsWith('/') ? WORKER_URL.slice(0, -1) : WORKER_URL
  return `${base}${path}`
}

async function request(path, { method = 'GET', body, authenticated = true } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  const token = getAuthToken()
  if (authenticated && token) headers.Authorization = `Bearer ${token}`

  let response
  try {
    response = await fetch(endpoint(path), {
      method,
      headers,
      credentials: 'include',
      ...(body ? { body: JSON.stringify(body) } : {}),
    })
  } catch {
    throw Object.assign(new Error('Payment worker unavailable'), { code: 'PAY_OFFLINE' })
  }

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw Object.assign(new Error(data.error ?? `HTTP ${response.status}`), {
      code: data.code ?? String(response.status),
      status: response.status,
    })
  }
  return data
}

/** All payment traffic goes to the Worker; no wallet keys ever reach the browser code. */
export const paymentsApi = {
  plans: () => request('/pay/plans', { authenticated: false }),
  createInvoice: (planId) => request('/pay/invoice', { method: 'POST', body: { planId } }),
  status: (invoiceId) => request(`/pay/status?invoice=${encodeURIComponent(invoiceId)}`),
  account: () => request('/account/plan'),
}
