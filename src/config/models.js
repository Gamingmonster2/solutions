/**
 * Model registry. Nothing is hard-coded in a tool: adding a model here makes
 * it available everywhere, and deprecated IDs can be retired in one place.
 *
 * lane "shared" -> browser -> our Worker -> Cloudflare Workers AI (free quota)
 * lane "byok"   -> browser -> provider directly (user's own key, no quota)
 *
 * Order matters: free models are listed first in the picker.
 * creditCost is how many daily free credits one request spends. Cheaper models
 * give more requests from the same Cloudflare neuron budget.
 */

const BASE_MODELS = [
  {
    id: '@cf/openai/gpt-oss-20b',
    label: 'GPT-OSS 20B',
    provider: 'cloudflare',
    lane: 'shared',
    badge: 'Free',
    creditCost: 1,
    note: 'Fast shared model — best daily allowance',
    noteAr: 'نموذج مشترك سريع — يمنحك أكبر عدد من الطلبات اليومية',
    keyUrl: null,
  },
  {
    id: '@cf/ibm-granite/granite-4.0-h-micro',
    label: 'Granite 4 Micro',
    provider: 'cloudflare',
    lane: 'shared',
    badge: 'Free · Eco',
    creditCost: 1,
    note: 'Very small footprint — longest free quota',
    noteAr: 'استهلاك منخفض جداً — أطول رصيد مجاني',
    keyUrl: null,
  },
  {
    id: '@cf/qwen/qwen2.5-coder-32b-instruct',
    label: 'Qwen 2.5 Coder 32B',
    provider: 'cloudflare',
    lane: 'shared',
    badge: 'Free · Code',
    creditCost: 2,
    note: 'Best for the code generator',
    noteAr: 'الأفضل لمولّد الأكواد',
    keyUrl: null,
  },
  {
    id: '@cf/openai/gpt-oss-120b',
    label: 'GPT-OSS 120B',
    provider: 'cloudflare',
    lane: 'shared',
    badge: 'Free · Pro',
    creditCost: 3,
    note: 'Strongest shared model — uses more quota',
    noteAr: 'أقوى نموذج مشترك — يستهلك رصيداً أكبر',
    keyUrl: null,
  },
  {
    id: 'openrouter/free',
    label: 'OpenRouter Free Router',
    provider: 'openrouter',
    lane: 'byok',
    badge: 'BYOK · Free',
    creditCost: 0,
    note: 'Auto-picks an available free model on your OpenRouter key',
    noteAr: 'يختار تلقائياً نموذجاً مجانياً متاحاً بمفتاح OpenRouter الخاص بك',
    keyUrl: 'https://openrouter.ai/keys',
    guideKey: 'guide.keyOpenRouter',
  },
  {
    id: 'openai/gpt-oss-120b',
    label: 'GPT-OSS 120B · Groq',
    provider: 'groq',
    lane: 'byok',
    badge: 'BYOK',
    creditCost: 0,
    note: 'Official replacement for llama-3.3-70b-versatile',
    noteAr: 'البديل الرسمي لـ llama-3.3-70b-versatile',
    keyUrl: 'https://console.groq.com/keys',
    guideKey: 'guide.keyGroq',
  },
  {
    id: 'openai/gpt-oss-20b',
    label: 'GPT-OSS 20B · Groq',
    provider: 'groq',
    lane: 'byok',
    badge: 'BYOK',
    creditCost: 0,
    note: 'Fast and cheap on your own key',
    noteAr: 'سريع واقتصادي بمفتاحك الخاص',
    keyUrl: 'https://console.groq.com/keys',
    guideKey: 'guide.keyGroq',
  },
  {
    id: 'qwen/qwen3.8-27b',
    label: 'Qwen 3.8 27B · Groq',
    provider: 'groq',
    lane: 'byok',
    badge: 'BYOK',
    creditCost: 0,
    note: 'Reasoning and multimodal',
    noteAr: 'تفكير ودعم متعدد الوسائط',
    keyUrl: 'https://console.groq.com/keys',
    guideKey: 'guide.keyGroq',
  },
]

export const DEFAULT_MODEL_ID = '@cf/openai/gpt-oss-20b'

const dynamicModels = new Map()

export const MODELS = BASE_MODELS

export const MODEL_BY_ID = Object.fromEntries(BASE_MODELS.map((model) => [model.id, model]))

export function getModel(id) {
  return dynamicModels.get(id) ?? MODEL_BY_ID[id] ?? MODEL_BY_ID[DEFAULT_MODEL_ID]
}

/** Models fetched from OpenRouter's live /models list (never stale). */
export function registerOpenRouterModels(models = []) {
  dynamicModels.clear()
  for (const model of models) {
    dynamicModels.set(model.id, {
      id: model.id,
      label: model.name ?? model.id,
      provider: 'openrouter',
      lane: 'byok',
      badge: 'BYOK · Free',
      creditCost: 0,
      note: 'Free model on your OpenRouter key',
      noteAr: 'نموذج مجاني بمفتاح OpenRouter الخاص بك',
      keyUrl: 'https://openrouter.ai/keys',
      guideKey: 'guide.keyOpenRouter',
      free: true,
    })
  }
}

export function clearOpenRouterModels() {
  dynamicModels.clear()
}

/** Free models first, then BYOK. Used by the picker and the guide page. */
export function orderedModels() {
  return [...MODELS, ...dynamicModels.values()]
}

export function modelsForLane(lane) {
  return orderedModels().filter((model) => model.lane === lane)
}

export function modelsForProvider(provider) {
  return orderedModels().filter((model) => model.provider === provider)
}

/** If a model was retired, silently move the user to a working sibling. */
export function fallbackFor(id) {
  const model = getModel(id)
  if (model.provider === 'groq') return MODEL_BY_ID['openai/gpt-oss-120b']
  if (model.provider === 'openrouter') return MODEL_BY_ID['openrouter/free']
  return MODEL_BY_ID['@cf/openai/gpt-oss-20b']
}
