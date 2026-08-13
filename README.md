# API quickstart - HTTP integration

Custom builder via External API - no embed iframes. Your server uploads the client's PDF, places fields, burn-previews, sends, and opens tab signing.

Vite (not Next.js) so StackBlitz/WebContainers do not hang on WASM SWC. API keys stay in `.env` on the server (`server/api.ts` via a Vite middleware plugin).

## Clone

Into the current directory (so `package.json` is at the project root, not in a nested folder):

```bash
git clone https://github.com/dvl-zeniark/stackblitz-zsign-api.git .
```

## `.env`

Fill `.env` with **your org** keys from ZSign Settings > Integrations. API base is staging:

```
ZSIGN_API_KEY=
ZSIGN_WEBHOOK_SECRET=
ZSIGN_API_BASE=https://stg-zsign.zeniark.net
```

```bash
npm install && npm run dev
```

## Use the app

Upload a PDF, create draft + recipient, place fields, preview, send, `/sign/{token}`.

## Read these

| File | Role |
|---|---|
| `lib/zsign.ts` | BFF client + `uploadDocument` |
| `server/api.ts` | Ping, documents, offers, webhooks |
| `lib/create-offer.ts` | Document + request + recipient |
| `lib/fields.ts` | POST/PATCH/DELETE fields |
| `components/PdfBurnPreview.tsx` | GET preview PDF |
| `components/ApiWorkspace.tsx` | Single-page builder UX |
