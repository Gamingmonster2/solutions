-- Solutions auth + per-account quota schema (Cloudflare D1 / SQLite).
-- Apply with: npx wrangler d1 execute solutions_auth --remote --config worker/wrangler.jsonc --file=worker/schema.sql

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  salt TEXT NOT NULL,
  created_at TEXT NOT NULL
);

-- `token` stores the SHA-256 digest of the session token, never the raw token.
-- The raw token lives only in the HttpOnly cookie / Authorization header.
CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expiry ON sessions(expires_at);

-- One row per user per UTC day. `date` is YYYY-MM-DD.
CREATE TABLE IF NOT EXISTS user_quotas (
  user_id TEXT NOT NULL,
  date TEXT NOT NULL,
  used INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (user_id, date),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ---------------------------------------------------------------------------
-- Direct USDC/Polygon checkout (self-custody, no payment provider)
-- ---------------------------------------------------------------------------

-- One row per invoice. `pay_amount` is the USDC amount in 6-decimal micro-units
-- and is globally unique: a 4-digit suffix is added to the plan price so each
-- payment can be attributed to exactly one account.
CREATE TABLE IF NOT EXISTS invoices (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  plan_id TEXT NOT NULL,
  price_usd_minor TEXT NOT NULL,
  credits INTEGER NOT NULL,
  pay_amount TEXT NOT NULL UNIQUE,
  receive_address TEXT NOT NULL,
  chain TEXT NOT NULL,
  coin TEXT NOT NULL,
  token_contract TEXT NOT NULL,
  created_at TEXT NOT NULL,
  quote_expires_at TEXT NOT NULL,
  accept_until TEXT NOT NULL,
  created_block INTEGER NOT NULL,
  last_scanned_block INTEGER NOT NULL,
  last_check_at TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  tx_hash TEXT,
  payer_address TEXT,
  paid_amount TEXT,
  detected_block INTEGER,
  detected_at TEXT,
  credited_at TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_invoices_user ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);

-- Audit trail. Chain data is untrusted, so every state change is recorded.
CREATE TABLE IF NOT EXISTS invoice_events (
  id TEXT PRIMARY KEY,
  invoice_id TEXT NOT NULL,
  type TEXT NOT NULL,
  payload TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_invoice_events_invoice ON invoice_events(invoice_id);

-- Idempotency ledger: once per invoice, no matter how many times the cron runs.
CREATE TABLE IF NOT EXISTS credit_grants (
  invoice_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  credits INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
);

-- One row per successfully APPLIED grant. A unique token is written in the same
-- atomic D1 batch as the credit balance update, so a retry can never double-credit
-- even if an earlier partial run left a credit_grants row behind.
CREATE TABLE IF NOT EXISTS credit_grant_applications (
  invoice_id TEXT PRIMARY KEY,
  token TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
);

-- Spendable paid credits. Free daily quota stays in user_quotas / KV.
CREATE TABLE IF NOT EXISTS paid_credits (
  user_id TEXT PRIMARY KEY,
  remaining INTEGER NOT NULL DEFAULT 0,
  lifetime_granted INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
