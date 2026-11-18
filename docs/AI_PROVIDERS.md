# AI provider & data-policy research

Last reviewed: 2026-11-18. Re-check before enabling any new provider.

## Decision

We do **not** put providers that train on prompts into the default free pool. Our free lane is Cloudflare Workers AI, which documents zero data retention and no model training. Visitors who want more choice can add their own key (BYOK). OpenRouter is the only wired provider with an explicit, visitor-controlled data-sharing switch.

## Providers

| Provider | Status | Training | Notes | Source |
| --- | --- | --- | --- | --- |
| Cloudflare Workers AI | Active shared lane | No | Zero data retention, no training. 10,000 Neurons/day free. | https://developers.cloudflare.com/workers-ai/platform/data-usage/ |
| Groq | Active BYOK | No | Free tier, 30 RPM / 1,000 RPD / 8K TPM / 200K TPD, organization-wide. | https://console.groq.com/docs/rate-limits |
| OpenRouter free models | Active BYOK | Optional | 20+ free models. We send `provider.data_collection: "deny"` by default; visitors may opt in locally. | https://openrouter.ai/docs/guides/privacy/provider-logging |
| Google Gemini API (free quota) | Not enabled | Yes | Unpaid quota uses prompts/responses to improve products; human reviewers may read them. Terms position the API for professional/business developers, not consumer apps. Libya is a supported region. | https://ai.google.dev/gemini-api/terms |
| Mistral Experiment tier | Not enabled | Yes | ~1B tokens/month free requires opting into training. Paid Production tier does not. | https://openrouter.ai/blog/tutorials/free-llm-apis-compared/ |
| Cohere free tier | Not enabled | No | Non-commercial only. | https://openrouter.ai/blog/tutorials/free-llm-apis-compared/ |
| Cerebras | Not enabled yet | No | Generous free throughput, no training. Good next BYOK candidate. | https://openrouter.ai/blog/tutorials/free-llm-apis-compared/ |

## OpenRouter behavior

- Default request body: `provider: { data_collection: "deny" }`.
- Opt-in stored only in the browser as `solutions_data_sharing = "allow"`.
- Removing the OpenRouter key resets the switch to `deny` and clears cached free models.
- Free model list is fetched from `https://openrouter.ai/api/v1/models` and cached for 6 hours.

## Never do

- Never place a data-training provider in the shared free lane.
- Never send a BYOK key through our Worker.
- Never enable data sharing by default or pre-check the consent switch.
- Never describe a free tier as "private" unless the provider's current terms say so.
