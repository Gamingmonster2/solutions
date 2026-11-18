import { fallbackFor, getModel } from '@/config/models'
import { PROVIDERS, providerFor } from '@/config/providers'
import { getDataSharing, getGroqKey, getOpenRouterKey } from '@/services/keys'
import { getAuthToken } from '@/services/auth'
import { mapProviderError } from '@/services/errors'

const WORKER_URL = import.meta.env.VITE_WORKER_URL ?? '/api'

function workerEndpoint() {
  return WORKER_URL.endsWith('/') ? `${WORKER_URL}ai` : `${WORKER_URL}/ai`
}

function requireKey(key, code) {
  if (!key) throw Object.assign(new Error('Missing API key'), { code })
}

async function callGroq({ modelId, messages, maxTokens, signal }) {
  const key = getGroqKey()
  requireKey(key, 'NO_GROQ_KEY')

  const config = PROVIDERS.groq
  const response = await fetch(`${config.baseUrl}/chat/completions`, {
    method: 'POST',
    signal,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: modelId,
      messages,
      temperature: 0.2,
      max_tokens: maxTokens ?? 2048,
    }),
  })

  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw Object.assign(new Error(body.error?.message ?? `HTTP ${response.status}`), {
      code: String(response.status),
    })
  }

  const data = await response.json()
  return cleanOutput(data.choices?.[0]?.message?.content ?? '')
}

/**
 * OpenRouter is the only wired provider with a real "data for free" choice.
 * Strict (default): data_collection deny — exclude providers that store/train.
 * Opt-in: data_collection allow — unlocks the widest set of free models.
 * The choice is per visitor and stored only in their browser.
 */
async function callOpenRouter({ modelId, messages, maxTokens, signal }) {
  const key = getOpenRouterKey()
  requireKey(key, 'NO_OPENROUTER_KEY')

  const config = PROVIDERS.openrouter
  const dataSharing = getDataSharing()

  const response = await fetch(`${config.baseUrl}/chat/completions`, {
    method: 'POST',
    signal,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
      'HTTP-Referer': typeof window === 'undefined' ? '' : window.location.origin,
      'X-Title': 'Solutions AI Platform',
    },
    body: JSON.stringify({
      model: modelId,
      messages,
      temperature: 0.2,
      max_tokens: maxTokens ?? 2048,
      provider: {
        data_collection: dataSharing ? 'allow' : 'deny',
      },
    }),
  })

  const body = await response.json().catch(() => ({}))

  if (!response.ok || body.error) {
    throw Object.assign(new Error(body.error?.message ?? `HTTP ${response.status}`), {
      code: String(body.error?.code ?? response.status),
    })
  }

  return cleanOutput(body.choices?.[0]?.message?.content ?? '')
}

async function callWorker({ modelId, messages, maxTokens, signal }) {
  // New privacy-friendly free models must be allowed by the Worker too.
  // A logged-in visitor gets a per-account quota in D1 instead of the KV/IP cap.
  const token = getAuthToken()
  const response = await fetch(workerEndpoint(), {
    method: 'POST',
    signal,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      model: modelId,
      messages,
      max_tokens: maxTokens ?? 2048,
    }),
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok || data.error) {
    throw Object.assign(new Error(data.error ?? `HTTP ${response.status}`), {
      code: String(data.code ?? response.status),
      quota: data.quota,
    })
  }

  return {
    text: cleanOutput(data.text ?? ''),
    quota: data.quota ?? null,
  }
}

/** Strip markdown fences and reasoning tags some open models emit. */
export function cleanOutput(text) {
  let output = String(text ?? '').trim()
  output = output.replace(/<think>[\s\S]*?<\/think>/gi, '')
  output = output.replace(/<\|channel\|>analysis[\s\S]*?<\|channel\|>final/gi, '')
  if (output.startsWith('```')) {
    const lines = output.split('\n')
    lines.shift()
    if (lines.at(-1)?.trim().startsWith('```')) lines.pop()
    output = lines.join('\n')
  }
  return output.trim()
}

async function callByok({ model, modelId, messages, maxTokens, signal }) {
  if (model.provider === 'openrouter') {
    return callOpenRouter({ modelId, messages, maxTokens, signal })
  }
  return callGroq({ modelId, messages, maxTokens, signal })
}

/** Single entry point for every tool. Returns { text, quota, modelId, lane }. */
export async function complete({ messages, modelId, maxTokens, lang = 'en', signal }) {
  const model = getModel(modelId)
  let activeModelId = model.id

  try {
    if (model.lane === 'byok') {
      return {
        text: await callByok({ model, modelId: activeModelId, messages, maxTokens, signal }),
        modelId: activeModelId,
        lane: 'byok',
        quota: null,
      }
    }
    const result = await callWorker({ modelId: activeModelId, messages, maxTokens, signal })
    return { ...result, modelId: activeModelId, lane: 'shared' }
  } catch (error) {
    const mapped = mapProviderError(error, lang)
    const retired = ['3042', '5007', '404', '400'].includes(mapped.code)

    if (retired) {
      const replacement = fallbackFor(activeModelId)
      if (replacement.id !== activeModelId) {
        activeModelId = replacement.id
        if (replacement.lane === 'byok') {
          return {
            text: await callByok({ model: replacement, modelId: activeModelId, messages, maxTokens, signal }),
            modelId: activeModelId,
            lane: 'byok',
            quota: null,
            switched: true,
          }
        }
        const result = await callWorker({ modelId: activeModelId, messages, maxTokens, signal })
        return { ...result, modelId: activeModelId, lane: 'shared', switched: true }
      }
    }

    throw Object.assign(new Error(mapped.message), {
      code: mapped.code,
      retryable: mapped.retryable,
      quota: error.quota,
    })
  }
}

export { providerFor }
