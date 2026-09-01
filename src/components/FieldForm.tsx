import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PdfBurnPreview } from "@/components/PdfBurnPreview";
import { fetchJson } from "@/lib/fetch-json";
import { recipientLabel, type Offer } from "@/lib/offers-shared";
import type { OfferField } from "@/lib/fields";

type Props = {
  requestId: string;
};

const DEFAULT_FIELD = {
  type: "signature",
  page: 1,
  x: 12,
  y: 22,
  width: 28,
  height: 8,
  required: true,
};

export function FieldForm({ requestId }: Props) {
  const [offer, setOffer] = useState<Offer | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [fieldForm, setFieldForm] = useState(DEFAULT_FIELD);
  const [fieldRecipientId, setFieldRecipientId] = useState("");
  const [previewKey, setPreviewKey] = useState(0);
  const [placedFields, setPlacedFields] = useState<OfferField[]>([]);

  async function load() {
    setLoading(true);
    try {
      const data = await fetchJson<{ offer: Offer }>(`/api/signature-requests/${requestId}`);
      setOffer(data.offer);
      setPlacedFields(data.offer.fields || []);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [requestId]);

  const recipients = offer?.recipients ?? [];
  const fields = placedFields.length ? placedFields : offer?.fields ?? [];

  useEffect(() => {
    if (!fieldRecipientId && recipients[0]?.id) {
      setFieldRecipientId(recipients[0].id);
    }
  }, [fieldRecipientId, recipients]);

  const missingFieldRecipients = useMemo(() => {
    const withField = new Set(
      fields.map((f) => f.recipientId).filter(Boolean) as string[],
    );
    return recipients.filter((r) => r.id && !withField.has(r.id));
  }, [fields, recipients]);

  async function saveField() {
    if (!fieldRecipientId) {
      setError("Pick a recipient for this field.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const { field: created } = await fetchJson<{ field: OfferField }>(
        `/api/signature-requests/${requestId}/fields`,
        {
          method: "POST",
          body: JSON.stringify({ ...fieldForm, recipientId: fieldRecipientId }),
        },
      );
      setPlacedFields((prev) => [...prev, created]);
      const nextIndex = fields.length + 1;
      setFieldForm({
        ...DEFAULT_FIELD,
        y: Math.min(80, DEFAULT_FIELD.y + nextIndex * 10),
      });
      setPreviewKey((k) => k + 1);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function removeField(fieldId: string) {
    setBusy(true);
    setError("");
    try {
      await fetchJson(`/api/signature-requests/${requestId}/fields/${fieldId}`, {
        method: "DELETE",
      });
      setPlacedFields((prev) => prev.filter((f) => f.id !== fieldId));
      setPreviewKey((k) => k + 1);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <p className="text-sm text-zinc-500">Loading...</p>;
  if (!offer) {
    return <p className="text-sm text-zinc-500">Signature request not found.</p>;
  }
  if (offer.status !== "draft") {
    return (
      <p className="text-sm text-zinc-500">
        Fields can only be edited on draft requests.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <section className="space-y-3 rounded-xl border border-zinc-200 bg-white p-5">
        <div>
          <h2 className="text-base font-semibold">Fields</h2>
          <p className="text-sm text-zinc-500">
            Each recipient needs at least one field before Send. x, y, width, and
            height are percents of the page (0-100).
          </p>
        </div>
        {fields.length ? (
          <ul className="divide-y divide-zinc-100 rounded-md border border-zinc-200">
            {fields.map((f) => {
              const owner = recipients.find((r) => r.id === f.recipientId);
              return (
                <li
                  key={f.id}
                  className="flex items-center justify-between gap-3 px-3 py-2 text-sm"
                >
                  <span className="min-w-0 truncate">
                    {f.type} · p{f.page}
                    {owner ? ` · ${recipientLabel(owner)}` : ""}
                  </span>
                  <button
                    type="button"
                    className="shrink-0 text-xs text-zinc-600 underline hover:text-zinc-900"
                    disabled={busy}
                    onClick={() => void removeField(f.id)}
                  >
                    Remove
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-sm text-zinc-500">No fields yet.</p>
        )}
        <div className="space-y-1">
          <Label htmlFor="field-recipient">Field recipient</Label>
          <select
            id="field-recipient"
            className="w-full rounded-md border border-zinc-300 px-2 py-2 text-sm"
            value={fieldRecipientId}
            onChange={(e) => setFieldRecipientId(e.target.value)}
          >
            <option value="">Select recipient...</option>
            {recipients.map((r) => (
              <option key={r.id} value={r.id}>
                {recipientLabel(r)}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1">
            <Label htmlFor="page">Page</Label>
            <Input
              id="page"
              type="number"
              min={1}
              value={fieldForm.page}
              onChange={(e) =>
                setFieldForm((p) => ({
                  ...p,
                  page: Number(e.target.value),
                }))
              }
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="x">X %</Label>
            <Input
              id="x"
              type="number"
              min={0}
              max={100}
              value={fieldForm.x}
              onChange={(e) =>
                setFieldForm((p) => ({ ...p, x: Number(e.target.value) }))
              }
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="y">Y %</Label>
            <Input
              id="y"
              type="number"
              min={0}
              max={100}
              value={fieldForm.y}
              onChange={(e) =>
                setFieldForm((p) => ({ ...p, y: Number(e.target.value) }))
              }
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="width">Width %</Label>
            <Input
              id="width"
              type="number"
              min={0}
              max={100}
              value={fieldForm.width}
              onChange={(e) =>
                setFieldForm((p) => ({
                  ...p,
                  width: Number(e.target.value),
                }))
              }
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="height">Height %</Label>
            <Input
              id="height"
              type="number"
              min={0}
              max={100}
              value={fieldForm.height}
              onChange={(e) =>
                setFieldForm((p) => ({
                  ...p,
                  height: Number(e.target.value),
                }))
              }
            />
          </div>
        </div>
        <Button type="button" disabled={busy} onClick={() => void saveField()}>
          Add field
        </Button>
        {missingFieldRecipients.length ? (
          <p className="text-xs text-amber-700">
            Still need a field for:{" "}
            {missingFieldRecipients.map(recipientLabel).join(", ")}
          </p>
        ) : null}
      </section>

      <PdfBurnPreview requestId={requestId} key={previewKey} />

      <div className="flex gap-3">
        <a
          href={`/signature-requests/${requestId}`}
          className="text-sm text-zinc-600 underline hover:text-zinc-900"
        >
          Back to request
        </a>
        {missingFieldRecipients.length === 0 && recipients.length > 0 ? (
          <a
            href={`/signature-requests/${requestId}/send`}
            className="text-sm font-medium text-zinc-900 underline hover:text-zinc-700"
          >
            Continue to Send
          </a>
        ) : null}
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
