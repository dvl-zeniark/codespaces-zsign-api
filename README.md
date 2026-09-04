# ZSign API quickstart

A small Astro app that calls the ZSign external API from your server — upload a
document, create a signature request, place fields, send it, open the signer link.
No iframe.

> **Branches:** **`main`** = partner default (Codespaces “Create”). **`nightly`** =
> in-progress sample work (agents / pre-release). **`deprecated`** = old SPA (not
> maintained).

## Setup

### 1. API key (required)

Create one in **ZSign → Settings → Integrations**.

### 2. `.env.local`

```sh
cp .env.example .env.local
```

```env
ZSIGN_API_KEY=your-key-here
ZSIGN_API_BASE=https://stg-zsign.zeniark.net
ZSIGN_WEBHOOK_SECRET=whsec_...
```

`ZSIGN_WEBHOOK_SECRET` is optional until you register a webhook endpoint (see below).

`src/lib/config.ts` reads `.env.local` on every request — no dev-server restart
after saving.

### 3. Run

```sh
npm install
npm run dev
```

## Where the integration lives

| File | Role |
|---|---|
| [`src/lib/zsign.ts`](src/lib/zsign.ts) | Bearer + Idempotency-Key; all ZSign HTTP calls go through here |
| [`src/lib/config.ts`](src/lib/config.ts) | `ZSIGN_API_KEY`, `ZSIGN_API_BASE` |
| [`src/lib/hmac.ts`](src/lib/hmac.ts) | Webhook HMAC verification |
| [`src/pages/api/signature-requests/index.ts`](src/pages/api/signature-requests/index.ts) | Example route: list + create |
| [`src/pages/signature-requests/`](src/pages/signature-requests/) | Product pages (sidebar routes) |

Keys never go in the browser — only `pages/api/*` and `lib/*` call ZSign.

## UI routes

| Path | What |
|---|---|
| `/documents` | Upload PDFs |
| `/signature-requests` | List |
| `/signature-requests/new` | Create draft |
| `/signature-requests/[id]/fields` | Place fields |
| `/signature-requests/[id]/send` | Send + signer link |
| `/webhooks` | Read-only webhook inbox |

## Webhooks

Register the webhook URL in **ZSign → Settings → Integrations → Webhooks**.
Paste the signing secret into `.env.local` as `ZSIGN_WEBHOOK_SECRET`.

The **Webhooks** page (`/webhooks`) shows the full endpoint URL for this running instance
(derived from the request origin). Relative path: `POST /api/webhooks/zsign`.

**Codespaces:** on attach, a **webhooks** terminal asks to make port **4321** Public (`y/N`).
Yes → uses the Codespaces session token already in the environment (no login / PAT). No (or if
the flip fails) → terminal prints: **Ports** tab → right-click **4321** → **Port Visibility** →
**Public**.

**Local `./dc.sh`:** use `http://localhost:5001/api/webhooks/zsign` for this API quickstart sample.

- [`src/pages/api/webhooks/zsign.ts`](src/pages/api/webhooks/zsign.ts) — verify HMAC, push to in-memory inbox
- [`src/pages/webhooks.astro`](src/pages/webhooks.astro) — read-only delivery list (no Connection panel, no key form)

## Commands

| Command | Action |
|---|---|
| `npm run dev` | Dev server (`:5001` under workspace `./dc.sh`) |
| `npm run build` | Production build |
| `npm run preview` | Preview build |
