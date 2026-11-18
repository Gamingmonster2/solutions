/**
 * Provider errors are translated into a stable shape so every tool shows the
 * same clear message in both languages.
 */
export function mapProviderError(error, lang = 'en') {
  const raw = error?.message ?? String(error)
  const code = error?.code ?? extractCode(raw)
  const arabic = lang === 'ar'

  const messages = {
    3036: arabic
      ? 'نفد الرصيد المجاني اليومي للمنصة. أضف مفتاحك الخاص أو حاول غداً.'
      : 'The platform daily free allowance is used up. Add your own key or try tomorrow.',
    3040: arabic
      ? 'الخدمة مزدحمة حالياً. حاول مرة أخرى بعد قليل.'
      : 'The service is at capacity right now. Try again in a moment.',
    5035: arabic
      ? 'هذا النموذج يتطلب خطة مدفوعة أو رصيداً كافياً لدى المزوّد. اختر نموذجاً آخر.'
      : 'This model requires a paid provider plan or sufficient credits. Choose another model.',
    3042: arabic ? 'معرف النموذج لم يعد موجوداً.' : 'This model ID no longer exists.',
    5007: arabic ? 'النموذج أو المهمة غير صالحين.' : 'Invalid model or task.',
    401: arabic ? 'مفتاح API غير صالح.' : 'Invalid API key.',
    402: arabic ? 'رصيد المزوّد غير كافٍ. أضف رصيداً أو اختر نموذجاً مجانياً.' : 'Provider credits are insufficient. Add credit or choose a free model.',
    403: arabic ? 'هذا المفتاح لا يسمح بهذا النموذج.' : 'This key is not allowed to use that model.',
    429: arabic ? 'تجاوزت حد الطلبات. حاول لاحقاً.' : 'Rate limit reached. Try later.',
    NO_GROQ_KEY: arabic ? 'أضف مفتاح Groq من نافذة المفاتيح.' : 'Add your Groq key in the key dialog.',
    NO_OPENROUTER_KEY: arabic ? 'أضف مفتاح OpenRouter من نافذة المفاتيح.' : 'Add your OpenRouter key in the key dialog.',
  }

  return {
    code: code ?? 'unknown',
    message: messages[code] ?? (arabic ? `تعذّر إكمال الطلب: ${raw}` : `Request failed: ${raw}`),
    retryable: ['3040', '429'].includes(String(code)),
    raw,
  }
}

function extractCode(raw) {
  const match = String(raw).match(/\b(3036|3040|5035|3042|5007|401|402|403|429)\b/)
  return match?.[1] ?? null
}
