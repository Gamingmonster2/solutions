import { STORAGE_KEYS } from '@/config/limits'

const WORKER_URL = import.meta.env.VITE_WORKER_URL ?? '/api'

function endpoint(path) {
  const base = WORKER_URL.endsWith('/') ? WORKER_URL.slice(0, -1) : WORKER_URL
  return `${base}${path}`
}

export function getAuthToken() {
  try {
    return localStorage.getItem(STORAGE_KEYS.authToken) ?? ''
  } catch {
    return ''
  }
}

export function setAuthToken(token) {
  localStorage.setItem(STORAGE_KEYS.authToken, token.trim())
}

export function clearAuthToken() {
  localStorage.removeItem(STORAGE_KEYS.authToken)
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
    throw Object.assign(new Error('Auth worker unavailable'), { code: 'AUTH_OFFLINE' })
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

/** All auth traffic goes to the Worker. The token is stored locally for Bearer use. */
export const authApi = {
  register: ({ email, password }) =>
    request('/auth/register', { method: 'POST', body: { email, password }, authenticated: false }),
  login: ({ email, password }) =>
    request('/auth/login', { method: 'POST', body: { email, password }, authenticated: false }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  me: () => request('/auth/me'),
}
