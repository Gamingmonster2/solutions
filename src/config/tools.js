export const TOOLS = [
  {
    id: 'solutions',
    label: { en: 'Solutions', ar: 'الحلول' },
    tagline: { en: 'The complete umbrella', ar: 'المظلة الكاملة' },
    description: {
      en: 'One workspace that brings every AI tool together.',
      ar: 'مساحة عمل واحدة تجمع كل أدوات الذكاء الاصطناعي.',
    },
    icon: 'LayoutGrid',
  },
  {
    id: 'chat',
    label: { en: 'Chat', ar: 'الدردشة' },
    tagline: { en: 'Chat on its own', ar: 'دردشة مستقلة' },
    description: {
      en: 'A focused conversational assistant.',
      ar: 'مساعد حواري مركّز.',
    },
    icon: 'MessageSquare',
  },
  {
    id: 'browser',
    label: { en: 'Browser', ar: 'التصفح' },
    tagline: { en: 'Browse the web with AI', ar: 'تصفّح الإنترنت بالذكاء الاصطناعي' },
    description: {
      en: 'Search Wikipedia and the Internet Archive, then let AI summarize.',
      ar: 'ابحث في ويكيبيديا وأرشيف الإنترنت، ثم لخّص بالذكاء الاصطناعي.',
    },
    icon: 'Globe2',
  },
  {
    id: 'code',
    label: { en: 'Code', ar: 'توليد الكود' },
    tagline: { en: 'Code with live preview', ar: 'كود مع معاينة مباشرة' },
    description: {
      en: 'Enhance an idea, generate code, preview, copy and edit.',
      ar: 'طوّر فكرتك، ولّد الكود، وعاينه وانسخه وعدّله.',
    },
    icon: 'Code2',
  },
  {
    id: 'bot',
    label: { en: 'Bot', ar: 'البوت' },
    tagline: { en: 'AI website builder', ar: 'بناء المواقع بالذكاء الاصطناعي' },
    description: {
      en: 'Describe a site, inject images, refine it and preview it live.',
      ar: 'صف موقعك، أضف الصور، حسّنه وعاينه مباشرة.',
    },
    icon: 'Bot',
  },
  {
    id: 'guide',
    label: { en: 'Guide', ar: 'الدليل' },
    tagline: { en: 'Plans, models & fair use', ar: 'الخطط والنماذج والاستخدام العادل' },
    description: {
      en: 'Transparent pricing, provider policies and key setup.',
      ar: 'أسعار وسياسات مزوّدين وإعداد مفاتيح بشفافية.',
    },
    icon: 'BookOpen',
  },
  {
    id: 'articles',
    label: { en: 'Articles', ar: 'المقالات' },
    tagline: { en: 'Ideas & insights', ar: 'أفكار ورؤى' },
    description: {
      en: 'Short reads about models, privacy, credits and the workspace.',
      ar: 'قراءات قصيرة عن النماذج والخصوصية والاعتمادات ومساحة العمل.',
    },
    icon: 'Newspaper',
  },
]

export const TOOL_BY_ID = Object.fromEntries(TOOLS.map((tool) => [tool.id, tool]))
