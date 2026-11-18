import { STORAGE_KEYS } from '@/config/limits'

function read(key) {
  try {
    return localStorage.getItem(key) ?? ''
  } catch {
    return ''
  }
}

function write(key, value) {
  localStorage.setItem(key, value.trim())
}

export const getGroqKey = () => read(STORAGE_KEYS.groqKey)
export const getOpenRouterKey = () => read(STORAGE_KEYS.openRouterKey)
export const getPexelsKey = () => read(STORAGE_KEYS.pexelsKey)
export const getPixabayKey = () => read(STORAGE_KEYS.pixabayKey)

export const setGroqKey = (key) => write(STORAGE_KEYS.groqKey, key)
export const setOpenRouterKey = (key) => write(STORAGE_KEYS.openRouterKey, key)
export const setPexelsKey = (key) => write(STORAGE_KEYS.pexelsKey, key)
export const setPixabayKey = (key) => write(STORAGE_KEYS.pixabayKey, key)

/** Opt-in only. Never default on: some free providers train on prompts. */
export function getDataSharing() {
  return read(STORAGE_KEYS.dataSharing) === 'allow'
}

export function setDataSharing(allowed) {
  write(STORAGE_KEYS.dataSharing, allowed ? 'allow' : 'deny')
}

export function hasGroqKey() {
  return Boolean(getGroqKey())
}

export function hasOpenRouterKey() {
  return Boolean(getOpenRouterKey())
}

export function removeGroqKey() {
  localStorage.removeItem(STORAGE_KEYS.groqKey)
}

export function removeOpenRouterKey() {
  localStorage.removeItem(STORAGE_KEYS.openRouterKey)
  write(STORAGE_KEYS.dataSharing, 'deny')
  localStorage.removeItem(STORAGE_KEYS.openRouterModels)
}

export function clearLocalData() {
  Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key))
}
