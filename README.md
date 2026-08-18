# ZSign API quickstart

A small Astro app that calls the ZSign external API directly from its own
server — upload a document, build a signature request, place fields, send
it, open the signer link. No iframe: this is what a plain server-to-server
integration looks like.

## 1. Get an API key

Create one in **ZSign → Settings → Integrations**.

## 2. Put it in `.env.local`

```sh
cp .env.example .env.local
```

```env
# .env.local
ZSIGN_API_KEY=your-key-here
ZSIGN_WEBHOOK_SECRET=          # only needed to test the webhook receiver, see below
ZSIGN_API_BASE=https://stg-zsign.zeniark.net
```

`.env.local` is read fresh on every request (see `src/lib/config.ts`) — no
dev-server restart needed after saving a change. It's git-ignored; never
commit real keys.

## 3. Run it

```sh
npm install
npm run dev
```

Or skip local setup entirely and open it in a Codespace — `.env.local` is
already wired up, you just need to paste your key in once it boots.

## Where the actual API calls happen

Everything below the app's UI is a thin wrapper around fetches to
`https://<ZSIGN_API_BASE>/api/v1/external/...`. Start here:

| File | What it does |
|---|---|
| [`src/lib/zsign.ts`](src/lib/zsign.ts) | The one place that calls the ZSign API. `zsign()` attaches the `Authorization: Bearer` header and an `Idempotency-Key` on writes; `zsignJson()`/`zsignPdf()` wrap it for JSON/PDF responses. Everything else in `src/lib/` calls through this. |
| [`src/lib/config.ts`](src/lib/config.ts) | Reads `ZSIGN_API_KEY` / `ZSIGN_API_BASE` from `.env.local`. |
| [`src/lib/documents.ts`](src/lib/documents.ts) | `listDocuments()` — `GET /documents`. Upload itself is `uploadDocument()` in `zsign.ts` (`POST /documents`, multipart). |
| [`src/lib/create-offer.ts`](src/lib/create-offer.ts) | The signature-request lifecycle: `createAndPrepareOffer()` (`POST /signature-requests` + recipients), `addRecipients()`/`removeRecipient()`, `sendOffer()` (`POST /signature-requests/{id}/send`). |
| [`src/lib/fields.ts`](src/lib/fields.ts) | Field placement: `placeField()`/`updateField()`/`deleteField()` — `POST`/`PATCH`/`DELETE /signature-requests/{id}/fields`. |
| [`src/lib/offers.ts`](src/lib/offers.ts) / [`offers-shared.ts`](src/lib/offers-shared.ts) | `listOffers()`/`getOffer()` (`GET /signature-requests`), and the `Offer` shape the UI works with. |
| [`src/lib/sign-url.ts`](src/lib/sign-url.ts) | Rewrites a minted embed URL into a plain `/sign/{token}` tab link — see `src/pages/api/offers/[id]/sign-url.ts`. |
| [`src/lib/hmac.ts`](src/lib/hmac.ts) | `verifyZsignWebhook()` — HMAC-SHA256 signature check for incoming webhooks. |

None of the `src/lib/` files above ever run in the browser — they're only
ever imported by the `src/pages/api/*.ts` route handlers, which is what
keeps `ZSIGN_API_KEY` server-side. The routes themselves are mostly
validation + calling one of the `lib/` functions and returning JSON; see
[`src/pages/api/offers/index.ts`](src/pages/api/offers/index.ts) for the
simplest example (list + create).

## The UI, if you want to see it wired end to end

`src/components/ApiWorkspace.tsx` is the nav shell; each section renders one
of `DocumentsPanel`, `OfferForm`, `ResumeDrafts` → `OfferDetail`,
`RequestsPanel`. `OfferDetail.tsx` is the one worth reading closely — it's
where recipients, field placement, the PDF preview, and Send all live
together for a single draft.

## Webhooks

The receiving endpoint is
[`src/pages/api/webhooks/zsign.ts`](src/pages/api/webhooks/zsign.ts), which
verifies the signature via `verifyZsignWebhook()` and logs the event to
`src/lib/inbox.ts` (shown live in the "Webhook inbox" panel at the bottom of
the page, via SSE — `src/pages/api/events.ts`). Point a webhook at
`<your-url>/api/webhooks/zsign`, set `ZSIGN_WEBHOOK_SECRET` to match what you
configured in ZSign, and deliveries will show up there.

## Commands

| Command | Action |
|---|---|
| `npm run dev` | Dev server on `:4321` locally (`:3011` under the workspace's `./dc.sh` stack) |
| `npm run build` | Production build to `./dist/` |
| `npm run preview` | Preview the production build |
