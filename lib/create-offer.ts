import { zsignJson, uploadDocument } from "./zsign.ts";
import {
  getOffer,
  toOffer,
  MAX_RECIPIENTS,
  type Offer,
  type OfferRecipient,
} from "./offers.ts";

export type RecipientInput = {
  firstName: string;
  lastName: string;
  email: string;
};

type Input = {
  roleTitle: string;
  recipients?: RecipientInput[];
  documentId?: string;
  pdfBytes?: Buffer;
  pdfFilename?: string;
  isBulk?: boolean;
};

type RecipientRow = {
  id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
};

function normalizeRecipients(rows: RecipientInput[]): RecipientInput[] {
  return rows
    .map((r) => ({
      firstName: r.firstName.trim(),
      lastName: r.lastName.trim(),
      email: r.email.trim().toLowerCase(),
    }))
    .filter((r) => r.firstName && r.lastName && r.email);
}

export async function createAndPrepareOffer(input: Input): Promise<Offer> {
  const recipients = normalizeRecipients(input.recipients || []);
  if (recipients.length > MAX_RECIPIENTS) {
    throw new Error(`At most ${MAX_RECIPIENTS} recipients per request`);
  }

  if (input.isBulk) {
    if (!recipients.length) {
      throw new Error("Bulk send needs at least one recipient");
    }
    let last: Offer | null = null;
    for (const recipient of recipients) {
      last = await createAndPrepareOffer({
        ...input,
        isBulk: false,
        recipients: [recipient],
      });
    }
    return last as Offer;
  }

  let documentId = input.documentId?.trim() || "";
  if (!documentId) {
    if (!input.pdfBytes) {
      throw new Error("documentId or a PDF upload is required");
    }
    const doc = await uploadDocument(
      input.pdfBytes,
      input.pdfFilename || "document.pdf",
    );
    documentId = doc.id;
  }

  const request = await zsignJson<{
    id: string;
    title?: string;
    requestStatus?: string;
  }>("signature-requests", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      documentId,
      title: input.roleTitle,
      subject: input.roleTitle,
      message: "Please review and sign this document.",
      signingOrder: "parallel",
    }),
  });

  let createdRecipients: RecipientRow[] = [];
  if (recipients.length) {
    const recipientsRes = await zsignJson<{ recipients?: RecipientRow[] }>(
      `signature-requests/${request.id}/recipients`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipients }),
      },
    );
    createdRecipients = recipientsRes.recipients || recipients;
  }

  return toOffer({
    ...request,
    recipients: createdRecipients,
  });
}

export async function addRecipients(
  requestId: string,
  rows: RecipientInput[],
): Promise<OfferRecipient[]> {
  const recipients = normalizeRecipients(rows);
  if (!recipients.length) {
    throw new Error("At least one recipient is required");
  }
  const res = await zsignJson<{ recipients?: RecipientRow[] }>(
    `signature-requests/${requestId}/recipients`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipients }),
    },
  );
  return (res.recipients || []).map((r) => ({
    id: r.id || "",
    firstName: r.firstName || "",
    lastName: r.lastName || "",
    email: r.email || "",
  }));
}

export async function removeRecipient(
  requestId: string,
  recipientId: string,
): Promise<void> {
  await zsignJson(
    `signature-requests/${requestId}/recipients/${recipientId}`,
    { method: "DELETE" },
  );
}

export async function sendOffer(id: string): Promise<Offer> {
  await zsignJson(`signature-requests/${id}/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}",
  });
  return getOffer(id);
}
