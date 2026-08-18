import type { OfferField } from "@/lib/fields";

/**
 * Client-safe: types + pure helpers only, no server-only imports.
 * Client components (e.g. ApiWorkspace) must import from here, not from
 * lib/offers - that file imports lib/zsign, which reads the server-only
 * ZSIGN_API_KEY and must never reach the client bundle.
 */

export const MAX_RECIPIENTS = 20;

export type OfferRecipient = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
};

export type Offer = {
  id: string;
  title: string;
  status: string;
  recipients: OfferRecipient[];
  fields: OfferField[];
  signerCount: number;
  candidateFirstName: string;
  candidateLastName: string;
  candidateEmail: string;
  recipientId: string;
};

export type Recipient = {
  id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
};

export type SignatureRequest = {
  id: string;
  title?: string;
  requestStatus?: string;
  createdAt?: string;
  recipients?: Recipient[];
  fields?: OfferField[];
  signerCount?: number;
};

export type ListResponse = { data?: SignatureRequest[] };

function toRecipient(r: Recipient): OfferRecipient {
  return {
    id: r.id || "",
    firstName: r.firstName || "",
    lastName: r.lastName || "",
    email: r.email || "",
  };
}

export function recipientLabel(r: OfferRecipient): string {
  const name = `${r.firstName} ${r.lastName}`.trim();
  return name ? `${name} · ${r.email}` : r.email || r.id.slice(0, 8);
}

export function recipientSummary(offer: Offer): string {
  if (offer.recipients.length) {
    const first = recipientLabel(offer.recipients[0]);
    const n = offer.recipients.length;
    return n === 1 ? first : `${first} +${n - 1} more`;
  }
  const n = offer.signerCount || 0;
  if (!n) return "No recipients";
  return n === 1 ? "1 recipient" : `${n} recipients`;
}

export function toOffer(sr: SignatureRequest): Offer {
  const recipients = (sr.recipients || []).map(toRecipient);
  const first = recipients[0];
  return {
    id: sr.id,
    title: sr.title || "Signature request",
    status: sr.requestStatus || "draft",
    recipients,
    fields: sr.fields || [],
    signerCount: recipients.length || sr.signerCount || 0,
    candidateFirstName: first?.firstName || "",
    candidateLastName: first?.lastName || "",
    candidateEmail: first?.email || "",
    recipientId: first?.id || "",
  };
}
