import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { DEFAULT_MODEL_ID, getModel, registerOpenRouterModels } from '@/config/models'
import { FREE_DAILY_REQUESTS, STORAGE_KEYS } from '@/config/limits'
import { PROVIDERS } from '@/config/providers'
import { complete } from '@/services/ai'
import { paymentsApi } from '@/services/payments'
import {
  getDataSharing, getGroqKey, getOpenRouterKey, getPexelsKey, getPixabayKey,
  removeGroqKey, removeOpenRouterKey, setDataSharing, setGroqKey,
  setOpenRouterKey, setPexelsKey, setPixabayKey,
} from '@/services/keys'
import { useSettings } from '@/hooks/useSettings'
import { useAuth } from '@/hooks/useAuth'

const QUOTA_KEY = 'solutions_quota_local'
const AIContext = createContext(null)

function today() {
  return new Date().toISOString().slice(0, 10)
}

function readQuota() {
  try {
    const stored = JSON.parse(localStorage.getItem(QUOTA_KEY) ?? '{}')
    return stored.date === today() ? Number(stored.count ?? 0) : 0
  } catch {
    return 0
  }
}

function readCachedFreeModels() {
  try {
    const cached = JSON.parse(localStorage.getItem(STORAGE_KEYS.openRouterModels) ?? '{}')
    if (Date.now() - Number(cached.at ?? 0) > 6 * 60 * 60 * 1000) return []
    return Array.isArray(cached.models) ? cached.models : []
  } catch {
    return []
  }
}

export function AIProvider({ children }) {
  const { t, lang } = useSettings()
  const { isAuthenticated } = useAuth()
  const [modelId, setModelIdState] = useState(() => localStorage.getItem(STORAGE_KEYS.model) ?? DEFAULT_MODEL_ID)
  const [keys, setKeys] = useState(() => ({
    groq: getGroqKey(),
    openrouter: getOpenRouterKey(),
    pexels: getPexelsKey(),
    pixabay: getPixabayKey(),
  }))
  const [dataSharing, setDataSharingState] = useState(getDataSharing)
  const [openRouterModels, setOpenRouterModels] = useState(readCachedFreeModels)
  const [used, setUsed] = useState(readQuota)
  const [paidRemaining, setPaidRemaining] = useState(0)

  /** Paid credits live in D1; the Worker is authoritative. */
  const refreshAccount = useCallback(async () => {
    if (!isAuthenticated) {
      setPaidRemaining(0)
      return 0
    }
    try {
      const account = await paymentsApi.account()
      setPaidRemaining(Number(account.paidCredits ?? 0))
      return Number(account.paidCredits ?? 0)
    } catch {
      return 0
    }
  }, [isAuthenticated])

  const registerModels = useCallback((models) => {
    registerOpenRouterModels(models)
    setOpenRouterModels(models)
  }, [])

  const refreshOpenRouterModels = useCallback(async () => {
    const key = getOpenRouterKey()
    if (!key) {
      registerModels([])
      localStorage.removeItem(STORAGE_KEYS.openRouterModels)
      return []
    }

    try {
      const response = await fetch(PROVIDERS.openrouter.modelsUrl, {
        headers: { Authorization: `Bearer ${key}` },
      })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const data = await response.json()
      const free = (data.data ?? [])
        .filter((item) => {
          const pricing = item.pricing ?? {}
          const isFree = pricing.prompt === '0' && pricing.completion === '0'
          return item.id === 'openrouter/free' || String(item.id).endsWith(':free') || isFree
        })
        .slice(0, 24)
        .map((item) => ({ id: item.id, name: item.name ?? item.id }))

      registerModels(free)
      localStorage.setItem(
        STORAGE_KEYS.openRouterModels,
        JSON.stringify({ at: Date.now(), models: free }),
      )
      return free
    } catch {
      return readCachedFreeModels()
    }
  }, [registerModels])

  useEffect(() => {
    const cached = readCachedFreeModels()
    if (cached.length) registerModels(cached)
    else refreshOpenRouterModels()
  }, [registerModels, refreshOpenRouterModels])

  // Account quotas live in D1 and are authoritative. Switch the indicator
  // between the guest mirror and the account view when auth state changes.
  useEffect(() => {
    setUsed(isAuthenticated ? 0 : readQuota())
    refreshAccount()
  }, [isAuthenticated, refreshAccount])

  const hasKeyFor = useCallback(
    (provider) => Boolean(provider === 'openrouter' ? keys.openrouter : keys.groq),
    [keys.groq, keys.openrouter],
  )

  const model = getModel(modelId)
  const hasKey = hasKeyFor(model.provider)

  const setModelId = useCallback((id) => {
    setModelIdState(id)
    localStorage.setItem(STORAGE_KEYS.model, id)
  }, [])

  const saveKey = useCallback((key, provider = 'groq') => {
    if (provider === 'openrouter') {
      setOpenRouterKey(key)
      setKeys((previous) => ({ ...previous, openrouter: getOpenRouterKey() }))
      refreshOpenRouterModels()
    } else {
      setGroqKey(key)
      setKeys((previous) => ({ ...previous, groq: getGroqKey() }))
    }
  }, [refreshOpenRouterModels])

  const deleteKey = useCallback((provider = 'groq') => {
    if (provider === 'openrouter') {
      removeOpenRouterKey()
      registerModels([])
      setDataSharingState(false)
      setKeys((previous) => ({ ...previous, openrouter: '' }))
    } else {
      removeGroqKey()
      setKeys((previous) => ({ ...previous, groq: '' }))
    }
  }, [registerModels])

  const updateDataSharing = useCallback((allowed) => {
    setDataSharing(allowed)
    setDataSharingState(allowed)
  }, [])

  const savePexelsKey = useCallback((key) => {
    setPexelsKey(key)
    setKeys((previous) => ({ ...previous, pexels: getPexelsKey() }))
  }, [])

  const savePixabayKey = useCallback((key) => {
    setPixabayKey(key)
    setKeys((previous) => ({ ...previous, pixabay: getPixabayKey() }))
  }, [])

  const incrementUsed = useCallback((amount = 1) => {
    setUsed((current) => {
      const next = current + amount
      localStorage.setItem(QUOTA_KEY, JSON.stringify({ date: today(), count: next }))
      return next
    })
  }, [])

  const run = useCallback(
    async ({ messages, maxTokens }) => {
      const active = getModel(modelId)
      if (active.lane === 'byok' && !hasKeyFor(active.provider)) {
        throw new Error(t(active.provider === 'openrouter' ? 'common.needOpenRouterKey' : 'common.needKey'))
      }
      // Logged-in visitors are checked by the Worker against D1; only guests
      // rely on the local mirror for the pre-flight check.
      if (active.lane === 'shared' && !isAuthenticated && used + active.creditCost > FREE_DAILY_REQUESTS) {
        throw new Error(t('quota.exhausted'))
      }

      const result = await complete({ messages, modelId, maxTokens, lang })
      if (result.lane === 'shared' && result.quota !== null) {
        if (typeof result.quota?.paid_remaining === 'number') {
          setPaidRemaining(result.quota.paid_remaining)
        }
        if (result.quota?.source === 'paid') {
          // Paid credits are tracked separately; the free daily counter stays.
        } else if (typeof result.quota?.used === 'number') {
          setUsed(result.quota.used)
          if (result.quota.source !== 'account') {
            localStorage.setItem(QUOTA_KEY, JSON.stringify({ date: today(), count: result.quota.used }))
          }
        } else {
          incrementUsed(active.creditCost)
        }
      }
      if (result.modelId && result.modelId !== modelId) setModelId(result.modelId)
      return result
    },
    [modelId, hasKeyFor, used, isAuthenticated, lang, incrementUsed, setModelId, t],
  )

  const value = useMemo(
    () => ({
      model, modelId, setModelId, hasKey, hasKeyFor,
      hasGroqKey: Boolean(keys.groq), hasOpenRouterKey: Boolean(keys.openrouter),
      saveKey, deleteKey,
      dataSharing, updateDataSharing, openRouterModels, refreshOpenRouterModels,
      pexelsKey: keys.pexels, pixabayKey: keys.pixabay, savePexelsKey, savePixabayKey,
      used, limit: FREE_DAILY_REQUESTS, remaining: Math.max(0, FREE_DAILY_REQUESTS - used),
      paidRemaining, refreshAccount, run,
    }),
    [
      model, modelId, setModelId, hasKey, hasKeyFor, keys.groq, keys.openrouter,
      keys.pexels, keys.pixabay, saveKey, deleteKey, dataSharing, updateDataSharing,
      openRouterModels, refreshOpenRouterModels, savePexelsKey, savePixabayKey, used,
      paidRemaining, refreshAccount, run,
    ],
  )

  return <AIContext.Provider value={value}>{children}</AIContext.Provider>
}

export function useAI() {
  const context = useContext(AIContext)
  if (!context) throw new Error('useAI must be used inside AIProvider')
  return context
}
