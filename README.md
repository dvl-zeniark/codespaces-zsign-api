# API quickstart - HTTP integration

Custom builder via External API - no embed iframes. Your server uploads the client's PDF, places fields, burn-previews, sends, and opens tab signing.

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

StackBlitz runs Next with WASM SWC (no native compiler). The first `Compiling /` can take a minute; later loads are faster.

## Use the app

Upload a PDF, create draft + recipient, place fields, preview, send, `/sign/{token}`.

## Read these

| File | Role |
|---|---|
| `lib/zsign.ts` | BFF client + `uploadDocument` |
| `lib/create-offer.ts` | Document + request + recipient |
| `lib/fields.ts` | POST/PATCH/DELETE fields |
| `components/PdfBurnPreview.tsx` | GET preview PDF |
| `components/ApiWorkspace.tsx` | Single-page builder UX |
| `app/api/offers` | Multipart create (your PDF file) |
