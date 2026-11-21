/**
 * Editorial content for the /articles page.
 *
 * Five articles are written in Arabic and five in English, on different
 * topics. Images are free-to-use abstract photographs from Pexels with no
 * people or living creatures, served at a fixed crop size for fast mobile
 * loading. Each article keeps its original language; the UI filter lets
 * readers choose which set to browse.
 */

const pexels = (id) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=1200&h=800&fit=crop`

export const ARTICLES = [
  {
    id: 'ar-model-choice',
    lang: 'ar',
    category: { ar: 'نماذج الذكاء الاصطناعي', en: 'AI models' },
    date: '2026-11-18',
    readMinutes: 4,
    image: pexels(30547584),
    imageAlt: { ar: 'نقوش تقنية مجرّدة بدرجات الأزرق', en: 'Abstract blue technology pattern' },
    title: 'كيف تختار النموذج المناسب لمهمتك؟',
    excerpt: 'ليست كل النماذج متساوية؛ اختيار النموذج الصحيح يوفّر اعتماداتك ويعطيك إجابة أفضل في وقت أقل.',
    body: [
      'عندما تفتح قائمة النماذج ستجد أكثر من خيار، وهذا ليس للتباهي بعدد النماذج بل لأن لكل نموذج وظيفة يناسبها. النماذج الخفيفة سريعة وتكفي لمعظم الأسئلة اليومية، بينما النماذج الأكبر أبطأ قليلاً لكنها أعمق في التحليل. القاعدة الذهبية أن تبدأ بالأخف ثم ترتقي فقط عندما تشعر أن الإجابة بحاجة إلى مزيد من العمق.',
      'في مساحتنا المجانية، نموذج Granite 4 Micro ونموذج GPT-OSS 20B يكلفان اعتماداً واحداً، وهما مناسبان للدردشة والتلخيص والترجمة. نموذج Qwen 2.5 Coder يكلف اعتمادين وهو مخصّص للكود، أما GPT-OSS 120B فيكلف ثلاثة اعتمادات ويفيد في المسائل المعقّدة التي تحتاج تفكيراً متعدد الخطوات.',
      'إن كنت تكتب كثيراً ولا تريد حساب الاعتمادات، أضف مفتاحك الخاص من Groq أو OpenRouter؛ فطلباتك حينها تذهب مباشرة إلى المزوّد ولا تلمس حصتك اليومية. أمّا إذا كان هدفك تجربة سريعة بلا إعدادات، فالابدأ بالنموذج المجاني الخفيف وكرّر السؤال بصياغة أوضح قبل أن تنتقل إلى نموذج أغلى.',
    ],
  },
  {
    id: 'ar-arabic-prompts',
    lang: 'ar',
    category: { ar: 'تقنيات الاستخدام', en: 'Techniques' },
    date: '2026-11-14',
    readMinutes: 5,
    image: pexels(28494632),
    imageAlt: { ar: 'تدرّج رقمي مجرّد بألوان بنفسجية', en: 'Abstract purple digital gradient' },
    title: 'الذكاء الاصطناعي بالعربية: اطلب بوضوح تحصل على الأفضل',
    excerpt: 'العربية لغة كاملة في نماذج الذكاء الاصطناعي؛ جمل قصيرة وسياق واضح يصنعان فرقاً كبيراً في النتيجة.',
    body: [
      'كثير من المستخدمين يظنّ أن النماذج تعمل بالإنجليزية فقط، لكن الواقع أنها تفهم العربية جيداً إذا قدّمت لها المطلوب بوضوح. المشكلة عادة ليست في اللغة، بل في السؤال نفسه: طلب غامض مثل «اكتب لي شيء» لا يحصل على إجابة أفضل حتى بالإنجليزية.',
      'اكتب الجمل قصيرة، وحدّد من البداية من هو الجمهور وما الشكل الذي تريده. على سبيل المثال قل: «لخّص هذا النص في خمس نقاط لطلاب الجامعة، بلهجة عربية بسيطة، دون مصطلحات تقنية». تحديد الطول والأسلوب والجمهور يوفّر على النموذج التخمين ويجعل الإجابة قابلة للاستخدام مباشرة.',
      'لا بأس من إدخال مصطلحات إنجليزية داخل الجملة العربية عندما تكون مصطلحات تقنية معروفة، مثل API أو CSS. لكن إن أردت الإجابة بالعربية صرّح بذلك، لأن النموذج قد يميل للرد باللغة التي كتبت بها المصطلح. واجهة المنصة تدعم اتجاه اليمين إلى اليسار بالكامل، لذا اكتب كما تكتب عادةً واترك التنسيق لنا.',
    ],
  },
  {
    id: 'ar-byok-privacy',
    lang: 'ar',
    category: { ar: 'الخصوصية', en: 'Privacy' },
    date: '2026-11-10',
    readMinutes: 6,
    image: pexels(40849227),
    imageAlt: { ar: 'خلفية تقنية مجرّدة بخطوط مضيئة', en: 'Glowing abstract technology background' },
    title: 'مفاتيحك الخاصة: خصوصية بلا تنازلات',
    excerpt: 'ما الذي يعنيه «استخدم مفتاحك» فعلياً، ولماذا نحن لا نرى مفتاحك ولا نحتاج إليه؟',
    body: [
      'مسار BYOK يعني ببساطة أن تفتح حساباً لدى مزوّد مثل Groq أو OpenRouter، تنسخ المفتاح، وتلصقه في نافذة الإعدادات لدينا. من تلك اللحظة، طلباتك تنتقل من متصفحك إلى المزوّد مباشرة؛ خادمنا لا يستلم المفتاح ولا يرى محتوى المحادثة.',
      'المفتاح يُحفظ في تخزين المتصفح المحلي فقط، ويمكن حذفه بضغطة زر في أي وقت. عند حذف مفتاح OpenRouter نُعيد أيضاً ضبط خيار مشاركة البيانات إلى الوضع الأمني، حتى لا يبقى أي إعداد يسمح باستخدام نصوصك في التدريب دون أن تدري.',
      'القاعدة الافتراضية في OpenRouter لدينا هي منع مزوّدي الاحتفاظ بالبيانات نهائياً. إن أردت تشكيلة أوسع من النماذج المجانية يمكنك تفعيل الخيار بنفسك بعد قراءة التحذير. أما المشاركة المجانية لدينا فتعمل عبر Cloudflare Workers AI بسياسة عدم الاحتفاظ بالبيانات، وهي مناسبة لمن لا يملك مفتاحاً أو يريد تجربة سريعة.',
    ],
  },
  {
    id: 'ar-keyless-browser',
    lang: 'ar',
    category: { ar: 'التصفح', en: 'Browsing' },
    date: '2026-11-06',
    readMinutes: 4,
    image: pexels(6985132),
    imageAlt: { ar: 'خلفية مجرّدة ناعمة بألوان هادئة', en: 'Soft abstract background with calm colors' },
    title: 'تصفّح ويكيبيديا والأرشيف بالذكاء الاصطناعي بلا مفتاح',
    excerpt: 'أداة التصفح لدينا لا تطلب مفتاحاً ولا تستهلك حصتك؛ إليك ما تستطيع فعله بها الآن.',
    body: [
      'صُمّمت أداة التصفح لتكون باباً مجانياً تماماً للمعرفة. تعتمد على واجهتين عامتين فقط: ويكيبيديا وأرشيف الإنترنت. لا يوجد مفتاح API مطلوب، ولا يُحفظ أي شيء عنك، ولا تُحتسب طلباتك ضمن الحصة اليومية.',
      'ابحث عن موضوع، افتح المقالة، ثم اطلب من النموذج تلخيصها أو شرحها بأسلوب أبسط. يمكنك أيضاً الرجوع إلى نسخة قديمة من صفحة عبر أرشيف الإنترنت ومقارنة كيف تغيّر المحتوى مع الوقت — وهي ميزة مفيدة للبحث والتدقيق.',
      'حدود النسخة الأولى واضحة: لا نبحث في الويب المفتوح بالكامل، ولا نصل إلى صفحات محمية أو محتوى مدفوع. هذه الحدود مقصودة لضمان بقاء الأداة خفيفة وسريعة ومجانية للجميع، مع إمكانية إضافة مصادر أخرى لاحقاً إن تطلّب الأمر.',
    ],
  },
  {
    id: 'ar-website-builder',
    lang: 'ar',
    category: { ar: 'بناء المواقع', en: 'Website building' },
    date: '2026-11-02',
    readMinutes: 5,
    image: pexels(3202032),
    imageAlt: { ar: 'تقنية رقمية مجرّدة بخطوط هندسية', en: 'Geometric abstract digital technology' },
    title: 'من فكرة إلى موقع: كيف تبني موقعك بالذكاء الاصطناعي',
    excerpt: 'وصف بسيط بالعربية يكفي لبدء موقعك؛ ثم حسّنه خطوة بخطوة مع معاينة مباشرة على كل مقاس.',
    body: [
      'ابدأ بوصف واضح: ما نوع الموقع، لمن هو، وما الأقسام التي تريدها. مثال: «موقع بسيط لورشة نجارة يعرض ثلاث خدمات وأرقام التواصل، بألوان دافئة». لا تحتاج إلى معرفة HTML أو CSS؛ المهم أن تعطي النموذج صورة ذهنية كاملة.',
      'بعد التوليد الأول، استخدم المعاينة المباشرة وانتقل بين مقاسات الجوال والتابلت وسطح المكتب. إن أردت صوراً، أضف مفتاح Pexels أو Pixabay من نافذة المفاتيح واطلب من النموذج إدراج صور مناسبة؛ وبدون مفتاح سيستخدم الموقع تدرّجات وخطوطاً أنيقة بدلاً من الصور.',
      'التحسين التدريجي أفضل من إعادة البناء من الصفر. اطلب تغيير لون واحد، أو إضافة قسم، أو تعديل نصّ، وراجع النتيجة فوراً. عندما تعجبك النسخة، انسخ الكود أو نزّل ملف HTML أو افتحه في تبويب جديد لمشاركته مع فريقك.',
    ],
  },
  {
    id: 'en-credits',
    lang: 'en',
    category: { ar: 'الاعتمادات', en: 'Credits' },
    date: '2026-11-17',
    readMinutes: 4,
    image: pexels(18419508),
    imageAlt: { ar: 'خلفية مستقبلية مجرّدة', en: 'Abstract futuristic background' },
    title: 'How the Free Credit System Actually Works',
    excerpt: 'Ten credits a day, reset at midnight UTC — and why we charge by weight instead of by message.',
    body: [
      'Every visitor gets ten credits per day on the shared lane. The counter resets at 00:00 UTC, so it is the same moment for everyone whatever their timezone. A small model costs one credit, the coding model two, and the largest shared model three. No card, no account and no API key are needed to start.',
      'Charging per credit rather than per message keeps the system fair. One short question to a small model and one long code generation do not cost the platform the same amount of compute, so a flat "requests per day" limit would either waste capacity or run out too early on heavier tasks. The credit value is shown next to every model in the picker before you send anything.',
      'If you run out, you have two clean options: add your own key and keep going without touching the quota, or wait for the UTC reset. Registered accounts keep their history and preferences, but the daily free cap stays the same for now. Paid credits, when added, are spent before free ones so you never lose a day of free usage.',
    ],
  },
  {
    id: 'en-prompt-to-code',
    lang: 'en',
    category: { ar: 'توليد الكود', en: 'Code generation' },
    date: '2026-11-13',
    readMinutes: 5,
    image: pexels(30608991),
    imageAlt: { ar: 'ضوء مجرّد متوهّج', en: 'Glowing abstract light' },
    title: 'From Prompt to Working Code in Two Steps',
    excerpt: 'Our code tool separates "enhance the idea" from "write the code" — here is why that matters.',
    body: [
      'Most code generators jump straight from a sentence to a file, which means a vague prompt produces vague code. Our two-step flow asks the model to first expand your idea into a clear specification: the layout, the interactions, the styling and the edge cases. You can read that specification and correct it before any code is written.',
      'The second step turns the approved specification into code you can preview immediately. The live preview is sandboxed, so a broken snippet cannot affect the rest of the page. From there you can copy the whole file, edit it inline, or iterate with a follow-up instruction such as "make the buttons larger on mobile".',
      'For the best result, mention the target framework and the visual style in your first prompt, and describe what the page should do rather than how to implement it. Let the model handle implementation details; spend your effort on describing the outcome you want to see in the preview.',
    ],
  },
  {
    id: 'en-usdc-checkout',
    lang: 'en',
    category: { ar: 'الاعتمادات المدفوعة', en: 'Paid credits' },
    date: '2026-11-09',
    readMinutes: 6,
    image: pexels(6913227),
    imageAlt: { ar: 'تقنية مجرّدة بخطوط نيون', en: 'Neon abstract technology pattern' },
    title: 'Direct USDC Checkout, Explained Simply',
    excerpt: 'No card processor and no webhook: here is how an on-chain payment becomes credits in your account.',
    body: [
      'Our paid path is deliberately simple. You choose a plan and we generate an invoice with a unique amount — for example 5.002695 USDC instead of exactly five. Those last four digits belong to your invoice, which is how the system knows which account to credit when the payment arrives.',
      'The payment goes from your own wallet straight to the owner\'s wallet on Polygon. Our Worker never holds funds, never sees a private key and does not depend on a payment provider or webhook. It only reads public chain data, matches the exact amount, waits for 64 confirmations and then records the credit grant once.',
      'Because the suffix is the invoice identity, the amount must be exact; even a small underpayment could match a different invoice. Gas is paid separately in POL. Paid credits are consumed before your daily free quota, so a purchase never costs you a single free credit. Receipts live in the invoice history with the transaction hash for independent verification.',
    ],
  },
  {
    id: 'en-design-themes',
    lang: 'en',
    category: { ar: 'التصميم', en: 'Design' },
    date: '2026-11-05',
    readMinutes: 4,
    image: pexels(8721315),
    imageAlt: { ar: 'تقنية مستقبلية مجرّدة', en: 'Abstract futuristic technology' },
    title: 'Built for Long Sessions: Three Themes and Real Spacing',
    excerpt: 'A calm interface is a feature. Here is the thinking behind our themes, typography and mobile layout.',
    body: [
      'AI work tends to happen in long sessions, so contrast and spacing matter more than decoration. We built three themes — default, dark and beige — and kept the same layout in each. Switch with one click in the header; the choice is remembered in your browser and follows you across all five domains.',
      'Typography is deliberately split: Sora for headings, Plus Jakarta Sans for interface text, and IBM Plex Sans Arabic for Arabic content with full right-to-left support. That combination stays legible at small sizes and keeps Latin code blocks readable even inside an Arabic page.',
      'On phones, the tool switcher becomes a horizontally scrollable strip and the model picker collapses, so the most used controls stay within thumb reach. Images use responsive crops and lazy loading, which keeps the first paint fast on a mobile connection without losing the visual quality of the cards.',
    ],
  },
  {
    id: 'en-five-domains',
    lang: 'en',
    category: { ar: 'المنصة', en: 'Platform' },
    date: '2026-11-01',
    readMinutes: 5,
    image: pexels(33386712),
    imageAlt: { ar: 'تكوين مجرّد ملوّن', en: 'Colorful abstract composition' },
    title: 'Five Domains, One Build: How Routing Works',
    excerpt: 'Each address opens its own tool, but they all share the same app, identity and deployment.',
    body: [
      'The five addresses — solutions, chat, browser, code and bot — are not five separate websites. They point to one build. On load, the app reads the hostname and opens the matching tool automatically, so typing chat.com.ly lands you directly in the chat, while com.net.ly opens the code generator.',
      'Everything else is shared: one sign-in, one quota, one set of themes and one deployment. You can still switch tools from the header at any time, and every tool is reachable by path on every domain. That means /chat works on bot.com.ly too, which is useful for sharing a single link regardless of where a visitor arrives.',
      'Search metadata is generated per host, so each domain has its own canonical URL, title, sitemap and robots file rather than competing with the others for the same keywords. It gives visitors a focused entry point while keeping the engineering — and your account — in one place.',
    ],
  },
]

export function articlesForLang(lang) {
  return ARTICLES.filter((article) => article.lang === (lang === 'ar' ? 'ar' : 'en'))
}
