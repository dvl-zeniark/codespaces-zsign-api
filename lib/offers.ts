import { zsignJson } from "@/lib/zsign";
import {
  toOffer,
  type Offer,
  type ListResponse,
  type SignatureRequest,
} from "@/lib/offers-shared";

export * from "@/lib/offers-shared";

export async function listOffers(): Promise<Offer[]> {
  const drafts = await zsignJson<ListResponse>(
    "signature-requests?status=draft&limit=50",
  );
  const rest = await zsignJson<ListResponse>("signature-requests?limit=50");
  const seen = new Set<string>();
  const rows: Offer[] = [];
  for (const sr of [...(drafts.data || []), ...(rest.data || [])]) {
    if (seen.has(sr.id)) continue;
    seen.add(sr.id);
    rows.push(toOffer(sr));
  }
  return rows;
}

export async function getOffer(id: string): Promise<Offer> {
  const sr = await zsignJson<SignatureRequest>(`signature-requests/${id}`);
  return toOffer(sr);
}
