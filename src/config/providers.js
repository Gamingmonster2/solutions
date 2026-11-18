/**
 * BYOK providers. Keys always stay in the browser and calls go from the
 * browser straight to the provider — never through our Worker.
 *
 * dataPolicy is a promise we make to the visitor, so it must match the
 * provider's real terms. Keep this file in sync with docs/AI_PROVIDERS.md.
 */
export const PROVIDERS = {
  groq: {
    id: 'groq',
    label: 'Groq',
    baseUrl: 'https://api.groq.com/openai/v1',
    keyUrl: 'https://console.groq.com/keys',
    docsUrl: 'https://console.groq.com/docs/rate-limits',
    keyPrefix: 'gsk_',
    dataPolicy: 'no-training',
  },
  openrouter: {
    id: 'openrouter',
    label: 'OpenRouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    modelsUrl: 'https://openrouter.ai/api/v1/models',
    keyUrl: 'https://openrouter.ai/keys',
    docsUrl: 'https://openrouter.ai/docs/guides/privacy/data-collection',
    keyPrefix: 'sk-or-',
    // Default is strict. The visitor can opt in to data-sharing free models.
    dataPolicy: 'no-training',
  },
}

export function providerFor(id) {
  return PROVIDERS[id] ?? PROVIDERS.groq
}

/**
 * Researched options that are NOT wired in by default. Each entry states the
 * real reason, so the guide page can explain it honestly in plain language.
 */
export const PROVIDER_NOTES = [
  {
    id: 'cloudflare',
    name: 'Cloudflare Workers AI',
    status: 'active',
    training: false,
    note: 'Zero data retention and no model training. This is our default free lane.',
    noteAr: 'احتفاظ صفري بالبيانات ولا تدريب على النماذج. هذا هو المسار المجاني الافتراضي لدينا.',
    url: 'https://developers.cloudflare.com/workers-ai/platform/data-usage/',
  },
  {
    id: 'groq',
    name: 'Groq',
    status: 'active',
    training: false,
    note: 'Free BYOK tier, no training. Limits are per organization, not per visitor.',
    noteAr: 'خطة مجانية بمفتاحك الخاص بلا تدريب على البيانات. الحدود على مستوى المؤسسة لا لكل زائر.',
    url: 'https://console.groq.com/docs/rate-limits',
  },
  {
    id: 'openrouter',
    name: 'OpenRouter free models',
    status: 'active',
    training: 'optional',
    note: '20+ free models. We force no-retention routing unless you explicitly opt in.',
    noteAr: 'أكثر من 20 نموذجاً مجانياً. نفرّح التوجيه بعدم الاحتفاظ بالبيانات إلا إذا اخترت السماح صراحةً.',
    url: 'https://openrouter.ai/docs/guides/privacy/provider-logging',
  },
  {
    id: 'google',
    name: 'Google Gemini API (free quota)',
    status: 'not-enabled',
    training: true,
    note: 'The unpaid quota uses prompts and replies to improve Google products; human reviewers may read them. Its terms also say the API is for developers building professional/business tools, not consumer-facing apps.',
    noteAr: 'الرصيد غير المدفوع يستخدم الطلبات والردود لتحسين منتجات Google، وقد يقرأها مراجعون بشريون. كما تنص شروطها على أن الـ API للمطورين الذين يبنون أدوات مهنية/تجارية لا لتطبيقات موجهة للمستهلكين.',
    url: 'https://ai.google.dev/gemini-api/terms',
  },
  {
    id: 'mistral',
    name: 'Mistral Experiment tier',
    status: 'not-enabled',
    training: true,
    note: 'Very large free token allowance (~1B/month) but access requires opting into data training; the paid Production tier does not.',
    noteAr: 'حصة رموز مجانية ضخمة (~1 مليار شهرياً) لكن الوصول يتطلب الموافقة على التدريب على بياناتك؛ الخطة المدفوعة Production لا تشترط ذلك.',
    url: 'https://openrouter.ai/blog/tutorials/free-llm-apis-compared/',
  },
  {
    id: 'cohere',
    name: 'Cohere free tier',
    status: 'not-enabled',
    training: false,
    note: 'No training, but the free tier is non-commercial only — not suitable for this platform.',
    noteAr: 'لا تدريب على البيانات، لكن الخطة المجانية للاستخدام غير التجاري فقط — غير مناسبة لمنصتنا.',
    url: 'https://openrouter.ai/blog/tutorials/free-llm-apis-compared/',
  },
  {
    id: 'cerebras',
    name: 'Cerebras',
    status: 'not-enabled',
    training: false,
    note: 'Generous free throughput with no training — a good privacy-safe BYOK candidate to add next.',
    noteAr: 'إنتاجية مجانية سخية بلا تدريب على البيانات — مرشح جيد لمفتاحك الخاص نضيفه لاحقاً.',
    url: 'https://openrouter.ai/blog/tutorials/free-llm-apis-compared/',
  },
]
