# Fair use & free quota (EN / AR)

## EN

The shared free lane exists so real visitors can try every tool without signing up or paying. To keep it available, please follow these rules.

### Your daily allowance
- **10 credits per visitor per day**, reset at **00:00 UTC**.
- Model costs: Granite 4 Micro = 1, GPT-OSS 20B = 1, Qwen 2.5 Coder 32B = 2, GPT-OSS 120B = 3.
- Quota is enforced server-side in Cloudflare KV and mirrored locally for the indicator.
- Adding your own Groq or OpenRouter key (BYOK) skips the free quota entirely.

### Allowed
- Normal human use of the tools.
- Switching between tools and models on the same domain.
- Asking the Browser tool to summarize public Wikipedia / Internet Archive results — it needs no key and is free.

### Not allowed
- Scripts, bots or automated traffic that send requests faster than a person could.
- Rotating IPs, clearing storage repeatedly, or sharing keys to bypass daily limits.
- Bulk generation, reselling outputs, or scraping the tools.
- Illegal, abusive or harmful content.

### Enforcement
- We may reduce limits, require signup, or block traffic that looks abusive.
- The goal is availability for real visitors, not punishment of heavy-but-legitimate use. If you need more, use BYOK or a paid plan when available.

### Cost note
100 visitors staying inside the free lane normally cost us **$0** (Cloudflare includes 10,000 Neurons/day). Overage on Workers Paid is about **$0.011 / 1,000 Neurons**. Per-visitor caps, fair use and BYOK keep this predictable.

---

## AR

المسار المجاني المشترك موجود حتى يتمكن الزوار الحقيقيون من تجربة كل الأدوات دون تسجيل أو دفع. ولإبقائه متاحاً، يرجى اتباع هذه القواعد.

### رصيدك اليومي
- **10 أرصدة لكل زائر يومياً**، تتجدد الساعة **00:00 بتوقيت UTC**.
- تكلفة النماذج: Granite 4 Micro = 1، GPT-OSS 20B = 1، Qwen 2.5 Coder 32B = 2، GPT-OSS 120B = 3.
- يُفرض الحد في Cloudflare KV وينعكس محلياً للمؤشر.
- إضافة مفتاح Groq أو OpenRouter الخاص بك (BYOK) تتخطى الرصيد المجاني تماماً.

### مسموح
- الاستخدام البشري الطبيعي للأدوات.
- التنقل بين الأدوات والنماذج على نفس النطاق.
- طلب تلخيص نتائج ويكيبيديا / أرشيف الإنترنت عبر أداة التصفح — بلا مفتاح ومجاني.

### غير مسموح
- السكربتات والبوتات والحركة الآلية التي ترسل طلبات أسرع من قدرة الإنسان.
- تبديل عناوين IP أو مسح التخزين مراراً أو مشاركة مفاتيح لتجاوز الحدود اليومية.
- التوليد بالجملة أو إعادة بيع المخرجات أو كشط الأدوات.
- المحتوى غير القانوني أو المسيء أو الضار.

### التطبيق
- قد نخفض الحدود أو نطلب التسجيل أو نحظر حركة تبدو مسيئة.
- الهدف إتاحة الخدمة للزوار الحقيقيين، لا معاقبة الاستخدام الكثيف المشروع. إذا احتجت أكثر، استخدم مفتاحك الخاص أو خطة مدفوعة عند توفرها.

### ملاحظة التكلفة
100 زائر داخل المسار المجاني تكلفنا عادةً **0 دولار** (Cloudflare يوفر 10,000 Neuron يومياً). الزيادة على خطة Workers Paid نحو **0.011 دولار / 1,000 Neuron**. الحدود لكل زائر والاستخدام العادل وخيار المفتاح الخاص تبقي التكلفة متوقعة.
