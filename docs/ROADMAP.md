# Roadmap: auth, tiers & monetization

Status: **auth implemented (D1 + Workers)**; **direct USDC/Polygon checkout implemented, locally tested and deployed to the production Worker** (2026-11-19, smoke tests passing). Card rail still blocked/planned; frontend Pages deploy + five domains still pending.

## 1. Auth tiers (implemented — first layer)

Cloudflare D1 + Workers auth is in place: PBKDF2 password hashing, D1 sessions, HttpOnly cookie + Bearer token, `/auth/register|login|logout|me`, and a per-account `user_quotas` table. The header has a sign-in / create-account dialog.

Goal for the next iteration: a guest can have a simple chat, but writing more / saving history requires signup.

- **Guest** — small free trial of the shared lane (current 10 credits/day cap) and all keyless browsing.
- **Free account** — persistent per-person quota, saved sessions/preferences, fair-use protection without blocking guests.
- **BYOK user** — own Groq/OpenRouter keys; no free quota consumed; no signup strictly required today, but signup will enable key sync later.
- **Paid** — higher quota, longer outputs, priority routing, no ads (if any).

Candidate backends (to choose): Cloudflare Workers + D1/KV with email magic links, or an auth provider (Clerk / Supabase Auth / Auth0). Decision criteria: Libya availability, cost at low volume, KYC/data residency, and whether keys must sync (they currently stay local by design).

## 2. Payments & crypto settlement

Full engineering spec: [docs/PAYMENTS.md](PAYMENTS.md) — three-leg architecture, TCO formula, Visa MCC/SCC7 rules, MiCA/Travel Rule/FinCEN/FCA, invoice lifecycle, refund policy and proposed D1 schema.

Requirement from the owner: accept **Visa / Mastercard** and receive settlement in **crypto to the owner's wallet**. Since mainstream card→crypto on-ramps exclude Libya (below), the owner approved a phased path: **direct USDC/Polygon to the self-custody wallet first**; cards deferred. Implementation details: [docs/PAYMENTS.md §11](PAYMENTS.md).

Facts checked (2026-11-18):

- **Coinbase Commerce** — hosted portal closed **31 Mar 2026**; not a viable card checkout.
- **BitPay** — crypto payments, but no direct card checkout for this use case.
- **NOWPayments** — quotes ~**1%** same-coin / **1.5%** converted; card→crypto options need verification.

Implemented (direct crypto path):

1. ~~Choose custody.~~ Owner chose **self-custody USDC on Polygon**, to the EVM address `0xc6240d79d9341d6e585ca1ddb9b121c8c8a130d4` confirmed from donatr.ee/sayfe.
2. ~~Choose plans.~~ `5$/100`, `10$/250`, `25$/700` credits.
3. ~~Build checkout.~~ Unique 4-digit micro-USDC suffix per invoice; exact-amount match; 64 confirmations; cron + guarded manual rescan; D1 atomic grant; paid credits consumed before free quota. Frontend dialog wired in header. See [§11](PAYMENTS.md).
4. ~~Local verification.~~ Simulated invoice settled to `paid`, 100 credits granted, rescan idempotent, `/ai` used paid credits first, free fallback verified.

Remaining blockers (card rail / production):

1. ~~Confirm processor availability/eligibility for Libya.~~ **Checked 2026-11-18: Mercuryo/NOWPayments fiat, Alchemy Pay, Wert and Dodo exclude Libya; BitPay/CoinGate do not accept cards for merchant invoices.** Details: [§10](PAYMENTS.md).
2. Confirm a real card→crypto settlement path and its fees. Only candidate found: Malum — Libya eligibility unverified, TCO ~7–10%, MD5 webhook signature. Not adopted.
3. Legal/tax treatment of receiving USDC in Libya (central bank / local counsel) — still open.
4. ~~Cloudflare production IDs + D1 remote schema + Worker deploy.~~ KV `3796c6a663b94fbda67f3069c6c0fb69`, D1 `a6e8367d-1521-474d-9eb4-a84691820958`, schema applied (13 queries/8 tables), Worker live at `https://solutions-ai-worker.safealigoog.workers.dev`, all auth/pay/SEO routes smoke-tested 2026-11-19. **Still pending:** Pages deploy, `VITE_WORKER_URL`, five domain attachments and Worker SEO routes. No real funds accepted yet.

MiCA's transition period ended **1 Jul 2026** (already past as of Nov 2026), so an EEA-facing provider must be a licensed CASP today — no grandfathering.

Do not publish card processor names or card prices in-app until 1–2 are verified. The USDC/Polygon path has no processor and no published fees beyond network gas.

## 3. Order of work

1. ~~Choose auth backend → add signup/login and per-user quota keys.~~ Done.
2. Add guest gating after a simple chat, with signup / BYOK / upgrade prompts.
3. ~~Direct USDC/Polygon checkout → credits.~~ Done locally; Worker deployed and production routes smoke-tested. Frontend Pages deploy/domains pending.
4. Verify a card processor with crypto settlement → add the card rail later.
5. Keep the free guest lane and BYOK path intact throughout.
