import { Router } from "express";
import multer from "multer";
import { verifyZsignWebhook } from "../lib/hmac.ts";
import { getWebhookSecret, listWebhooks, recordWebhook } from "../lib/inbox.ts";
import { listDocuments } from "../lib/documents.ts";
import { uploadDocument, zsignJson, zsignPdf } from "../lib/zsign.ts";
import {
  addRecipients,
  createAndPrepareOffer,
  removeRecipient,
  sendOffer,
  type RecipientInput,
} from "../lib/create-offer.ts";
import { getOffer, listOffers, MAX_RECIPIENTS } from "../lib/offers.ts";
import {
  deleteField,
  placeField,
  updateField,
  type FieldPlacementInput,
} from "../lib/fields.ts";
import { toSignTabUrl } from "../lib/sign-url.ts";
import { jsonError } from "./http.ts";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
});

function parseRecipients(body: {
  recipients?: RecipientInput[];
  candidateFirstName?: string;
  candidateLastName?: string;
  candidateEmail?: string;
}): RecipientInput[] {
  if (Array.isArray(body.recipients) && body.recipients.length) {
    return body.recipients;
  }
  const firstName = String(body.candidateFirstName || "").trim();
  const lastName = String(body.candidateLastName || "").trim();
  const email = String(body.candidateEmail || "").trim();
  if (firstName && lastName && email) {
    return [{ firstName, lastName, email }];
  }
  return [];
}

export function apiRouter(): Router {
  const r = Router();

  r.get("/ping", async (_req, res) => {
    try {
      const pong = await zsignJson<{ pong?: boolean }>("ping");
      res.json({ ok: true, pong });
    } catch (err) {
      jsonError(res, err);
    }
  });

  r.get("/webhooks/inbox", (_req, res) => {
    res.json({ events: listWebhooks() });
  });

  r.get("/documents", async (_req, res) => {
    try {
      res.json({ documents: await listDocuments() });
    } catch (err) {
      jsonError(res, err);
    }
  });

  r.post("/documents", upload.single("file"), async (req, res) => {
    try {
      const file = req.file;
      if (!file) {
        res.status(400).json({ message: "Document (PDF) is required" });
        return;
      }
      const filename = file.originalname?.trim() || "document.pdf";
      const doc = await uploadDocument(file.buffer, filename);
      res.status(201).json({ document: doc });
    } catch (err) {
      jsonError(res, err);
    }
  });

  r.get("/offers", async (_req, res) => {
    try {
      res.json({ offers: await listOffers() });
    } catch (err) {
      jsonError(res, err);
    }
  });

  r.post("/offers", async (req, res) => {
    try {
      const body = req.body as {
        roleTitle?: string;
        recipients?: RecipientInput[];
        candidateFirstName?: string;
        candidateLastName?: string;
        candidateEmail?: string;
        documentId?: string;
        isBulk?: boolean;
      };
      const roleTitle = String(body.roleTitle || "").trim();
      const recipients = parseRecipients(body);
      const documentId = String(body.documentId || "").trim();
      if (!roleTitle) {
        res.status(400).json({ message: "Title is required" });
        return;
      }
      if (recipients.length > MAX_RECIPIENTS) {
        res
          .status(400)
          .json({ message: `At most ${MAX_RECIPIENTS} recipients per request` });
        return;
      }
      if (!documentId) {
        res.status(400).json({
          message: "documentId is required. Upload a Document first.",
        });
        return;
      }
      const offer = await createAndPrepareOffer({
        roleTitle,
        recipients,
        documentId,
        isBulk: Boolean(body.isBulk),
      });
      res.status(201).json({ offer });
    } catch (err) {
      jsonError(res, err);
    }
  });

  r.get("/offers/:id", async (req, res) => {
    try {
      res.json({ offer: await getOffer(req.params.id) });
    } catch (err) {
      jsonError(res, err);
    }
  });

  r.post("/offers/:id/send", async (req, res) => {
    try {
      res.json({ offer: await sendOffer(req.params.id) });
    } catch (err) {
      jsonError(res, err);
    }
  });

  r.get("/offers/:id/preview", async (req, res) => {
    try {
      const blob = await zsignPdf(
        `signature-requests/${req.params.id}/preview`,
      );
      const buf = Buffer.from(await blob.arrayBuffer());
      res.type("application/pdf").send(buf);
    } catch (err) {
      jsonError(res, err);
    }
  });

  r.post("/offers/:id/sign-url", async (req, res) => {
    try {
      const id = req.params.id;
      const offer = await getOffer(id);
      let recipientId = String(req.body?.recipientId || "").trim();
      if (!recipientId) recipientId = offer.recipientId;
      if (!recipientId) {
        res.status(400).json({ message: "No signer on this request yet" });
        return;
      }
      if (!offer.recipients.some((row) => row.id === recipientId)) {
        res.status(400).json({
          message: "Recipient is not on this signature request",
        });
        return;
      }
      const minted = await zsignJson<{ url?: string }>(
        `embed/signature-requests/${id}/recipients/${recipientId}`,
      );
      res.json({ url: toSignTabUrl(minted.url || "") });
    } catch (err) {
      jsonError(res, err);
    }
  });

  r.post("/offers/:id/fields", async (req, res) => {
    try {
      const id = req.params.id;
      const offer = await getOffer(id);
      const body = req.body as Partial<FieldPlacementInput>;
      const recipientId = String(body.recipientId || "").trim();
      if (!recipientId) {
        res
          .status(400)
          .json({ message: "Pick a recipient before placing a field" });
        return;
      }
      if (!offer.recipients.some((row) => row.id === recipientId)) {
        res.status(400).json({
          message: "Recipient is not on this signature request",
        });
        return;
      }
      const field = await placeField(id, {
        recipientId,
        type: body.type || "signature",
        page: Number(body.page) || 1,
        x: Number(body.x),
        y: Number(body.y),
        width: Number(body.width),
        height: Number(body.height),
        required: body.required ?? true,
      });
      res.status(201).json({ field });
    } catch (err) {
      jsonError(res, err);
    }
  });

  r.patch("/offers/:id/fields/:fieldId", async (req, res) => {
    try {
      const field = await updateField(
        req.params.id,
        req.params.fieldId,
        req.body as Partial<FieldPlacementInput>,
      );
      res.json({ field });
    } catch (err) {
      jsonError(res, err);
    }
  });

  r.delete("/offers/:id/fields/:fieldId", async (req, res) => {
    try {
      await deleteField(req.params.id, req.params.fieldId);
      res.status(204).end();
    } catch (err) {
      jsonError(res, err);
    }
  });

  r.post("/offers/:id/recipients", async (req, res) => {
    try {
      const id = req.params.id;
      const offer = await getOffer(id);
      const incoming = Array.isArray(req.body?.recipients)
        ? (req.body.recipients as RecipientInput[])
        : [];
      if (!incoming.length) {
        res.status(400).json({ message: "At least one recipient is required" });
        return;
      }
      if (offer.recipients.length + incoming.length > MAX_RECIPIENTS) {
        res.status(400).json({
          message: `At most ${MAX_RECIPIENTS} recipients per request`,
        });
        return;
      }
      const recipients = await addRecipients(id, incoming);
      res.status(201).json({ offer: await getOffer(id), added: recipients });
    } catch (err) {
      jsonError(res, err);
    }
  });

  r.delete("/offers/:id/recipients/:recipientId", async (req, res) => {
    try {
      await removeRecipient(req.params.id, req.params.recipientId);
      res.json({ offer: await getOffer(req.params.id) });
    } catch (err) {
      jsonError(res, err);
    }
  });

  return r;
}

function header(
  headers: import("express").Request["headers"],
  name: string,
): string | null {
  const value = headers[name];
  if (Array.isArray(value)) return value[0] || null;
  return value || null;
}

export function webhookHandler(
  req: import("express").Request,
  res: import("express").Response,
) {
  const rawBody = Buffer.isBuffer(req.body)
    ? req.body.toString("utf8")
    : String(req.body || "");
  const verified = verifyZsignWebhook({
    rawBody,
    signatureHeader: header(req.headers, "x-zsign-signature"),
    timestampHeader: header(req.headers, "x-zsign-timestamp"),
    secret: getWebhookSecret(),
  });
  if (!verified.ok) {
    res.status(401).json({
      received: true,
      verified: false,
      error: verified.error,
    });
    return;
  }
  recordWebhook(header(req.headers, "x-zsign-event") || "unknown");
  res.json({ received: true, verified: true });
}
