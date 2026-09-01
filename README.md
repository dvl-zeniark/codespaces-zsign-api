# ZSign API quickstart

A small Astro app that calls the ZSign external API from your server — upload a
document, create a signature request, place fields, send it, open the signer link.
No iframe.

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

Register `POST /api/webhooks/zsign` in **ZSign → Settings → Integrations → Webhooks**.
Paste the signing secret into `.env.local` as `ZSIGN_WEBHOOK_SECRET`.

- [`src/pages/api/webhooks/zsign.ts`](src/pages/api/webhooks/zsign.ts) — verify HMAC, push to in-memory inbox
- [`src/pages/webhooks.astro`](src/pages/webhooks.astro) — read-only delivery list (no Connection panel, no key form)

## Commands

| Command | Action |
|---|---|
| `npm run dev` | Dev server (`:5001` under workspace `./dc.sh`) |
| `npm run build` | Production build |
| `npm run preview` | Preview build |
