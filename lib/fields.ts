import { zsign, zsignJson, ZsignError } from "@/lib/zsign";

export type OfferField = {
  id: string;
  type: string;
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  required?: boolean;
  recipientId?: string;
};

export type FieldPlacementInput = {
  recipientId: string;
  type: string;
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  required?: boolean;
};

export async function placeField(
  requestId: string,
  input: FieldPlacementInput,
): Promise<OfferField> {
  return zsignJson<OfferField>(`signature-requests/${requestId}/fields`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export async function updateField(
  requestId: string,
  fieldId: string,
  input: Partial<FieldPlacementInput>,
): Promise<OfferField> {
  return zsignJson<OfferField>(
    `signature-requests/${requestId}/fields/${fieldId}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
  );
}

export async function deleteField(requestId: string, fieldId: string): Promise<void> {
  const res = await zsign(`signature-requests/${requestId}/fields/${fieldId}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const text = await res.text();
    let body: unknown = null;
    if (text) {
      try {
        body = JSON.parse(text);
      } catch {
        body = { raw: text };
      }
    }
    throw new ZsignError(res.status, body);
  }
}
