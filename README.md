# API quickstart - HTTP integration

Custom builder via External API — no embed iframes. Your server uploads the client's PDF, places fields, burn-previews, sends, and opens tab signing.

## `.env`

Paste **your org** keys from ZSign Settings > Integrations. No bundled demo keys.

```
ZSIGN_API_KEY=
ZSIGN_WEBHOOK_SECRET=
```

```bash
# From workspace root (preferred)
./dc.sh up
./dc.sh logs -f partner-quickstart-api

# Host-native
npm install && npm run dev
```

## Use the app

Compose service **`partner-quickstart-api`**. Upload a PDF, create draft + recipient, place fields, preview, send, `/sign/{token}`.

## Read these

| File | Role |
|---|---|
| `lib/zsign.ts` | BFF client + `uploadDocument` |
| `lib/create-offer.ts` | Document + request + recipient |
| `lib/fields.ts` | POST/PATCH/DELETE fields |
| `components/PdfBurnPreview.tsx` | GET preview PDF |
| `components/ApiWorkspace.tsx` | Single-page builder UX |
| `app/api/offers` | Multipart create (your PDF file) |
