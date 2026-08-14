"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PdfBurnPreview } from "@/components/PdfBurnPreview";
import { api } from "@/lib/client";
import { useLiveEvents } from "@/lib/use-live-events";
import {
  MAX_RECIPIENTS,
  recipientLabel,
  type Offer,
  type OfferRecipient,
} from "@/lib/offers";
import type { OfferField } from "@/lib/fields";

const STATUS: Record<string, string> = {
  draft: "Draft",
  pending: "Sent",
  completed: "Completed",
  declined: "Declined",
  canceled: "Canceled",
  expired: "Expired",
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

export function OfferDetail({ id }: { id: string }) {
  const queryClient = useQueryClient();
  const q = useQuery({
    queryKey: ["offer", id],
    queryFn: () => api<{ offer: Offer }>(`/api/offers/${id}`),
    // SSE (below) pushes real updates; this interval is just a fallback in
    // case the stream drops, so it stays slow and stops entirely on error.
    refetchInterval: (query) => (query.state.status === "error" ? false : 20000),
  });
  useLiveEvents(
    useCallback(() => {
      queryClient.invalidateQueries({ queryKey: ["offer", id] });
    }, [queryClient, id]),
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [fieldForm, setFieldForm] = useState(DEFAULT_FIELD);
  const [fieldRecipientId, setFieldRecipientId] = useState("");
  const [previewKey, setPreviewKey] = useState(0);
  const [addRow, setAddRow] = useState({
    firstName: "",
    lastName: "",
    email: "",
  });
  const [placedFields, setPlacedFields] = useState<OfferField[]>([]);

  const offer = q.data?.offer;
  const recipients = offer?.recipients ?? [];
  const fields = placedFields.length ? placedFields : offer?.fields ?? [];

  useEffect(() => {
    setPlacedFields([]);
    setFieldRecipientId("");
  }, [id]);

  useEffect(() => {
    if (offer?.fields?.length) setPlacedFields(offer.fields);
  }, [offer?.fields]);

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

  async function addRecipients() {
    const firstName = addRow.firstName.trim();
    const lastName = addRow.lastName.trim();
    const email = addRow.email.trim();
    if (!firstName || !lastName || !email) {
      setError("First name, last name, and email are required.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await api(`/api/offers/${id}/recipients`, {
        method: "POST",
        body: JSON.stringify({
          recipients: [{ firstName, lastName, email }],
        }),
      });
      setAddRow({ firstName: "", lastName: "", email: "" });
      await q.refetch();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function removeRecipient(recipientId: string) {
    setBusy(true);
    setError("");
    try {
      await api(`/api/offers/${id}/recipients/${recipientId}`, {
        method: "DELETE",
      });
      if (fieldRecipientId === recipientId) setFieldRecipientId("");
      await q.refetch();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function saveField() {
    if (!fieldRecipientId) {
      setError("Pick a recipient for this field.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const { field: created } = await api<{ field: OfferField }>(
        `/api/offers/${id}/fields`,
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
      await q.refetch();
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
      await api(`/api/offers/${id}/fields/${fieldId}`, { method: "DELETE" });
      setPlacedFields((prev) => prev.filter((f) => f.id !== fieldId));
      setPreviewKey((k) => k + 1);
      await q.refetch();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function send() {
    setBusy(true);
    setError("");
    try {
      await api(`/api/offers/${id}/send`, { method: "POST" });
      await q.refetch();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function openSigner(recipient: OfferRecipient) {
    setBusy(true);
    setError("");
    try {
      const { url } = await api<{ url: string }>(`/api/offers/${id}/sign-url`, {
        method: "POST",
        body: JSON.stringify({ recipientId: recipient.id }),
      });
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (q.isLoading) return <p className="text-sm text-zinc-500">Loading...</p>;
  if (!offer) {
    return (
      <p className="text-sm text-zinc-500">Signature request not found.</p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-zinc-200 bg-white p-5">
        <p className="text-xs uppercase tracking-wide text-zinc-500">
          Signature request
        </p>
        <h1 className="text-xl font-semibold">{offer.title}</h1>
        <p className="mt-2 text-sm">
          Status: <strong>{STATUS[offer.status] || offer.status}</strong>
          {" · "}
          {recipients.length} recipient{recipients.length === 1 ? "" : "s"}
        </p>
      </div>

      <section className="space-y-3 rounded-xl border border-zinc-200 bg-white p-5">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold">Recipients</h2>
            <p className="text-sm text-zinc-500">
              POST /external/signature-requests/{"{id}"}/recipients (max{" "}
              {MAX_RECIPIENTS}).
            </p>
          </div>
        </div>
        {recipients.length === 0 ? (
          <p className="text-sm text-zinc-500">No recipients yet.</p>
        ) : (
          <ul className="divide-y divide-zinc-100 rounded-md border border-zinc-200">
            {recipients.map((r) => (
              <li
                key={r.id || r.email}
                className="flex items-center justify-between gap-3 px-3 py-2 text-sm"
              >
                <span className="min-w-0 truncate">{recipientLabel(r)}</span>
                {offer.status === "draft" && r.id ? (
                  <button
                    type="button"
                    className="shrink-0 text-xs text-zinc-600 underline hover:text-zinc-900"
                    disabled={busy}
                    onClick={() => void removeRecipient(r.id)}
                  >
                    Remove
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        )}
        {offer.status === "draft" ? (
          <div className="grid gap-3 rounded-md border border-dashed border-zinc-300 p-3 sm:grid-cols-2">
            <p className="text-xs font-medium text-zinc-500 sm:col-span-2">
              Add another recipient
            </p>
            <div className="space-y-1">
              <Label htmlFor="add-first">First name</Label>
              <Input
                id="add-first"
                value={addRow.firstName}
                onChange={(e) =>
                  setAddRow((p) => ({ ...p, firstName: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="add-last">Last name</Label>
              <Input
                id="add-last"
                value={addRow.lastName}
                onChange={(e) =>
                  setAddRow((p) => ({ ...p, lastName: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="add-email">Email</Label>
              <Input
                id="add-email"
                type="email"
                value={addRow.email}
                onChange={(e) =>
                  setAddRow((p) => ({ ...p, email: e.target.value }))
                }
              />
            </div>
            <div className="sm:col-span-2">
              <Button
                type="button"
                variant="outline"
                disabled={busy || recipients.length >= MAX_RECIPIENTS}
                onClick={() => void addRecipients()}
              >
                Add recipient
              </Button>
            </div>
          </div>
        ) : null}
      </section>

      {offer.status === "draft" ? (
        <>
          <section className="space-y-3 rounded-xl border border-zinc-200 bg-white p-5">
            <div>
              <h2 className="text-base font-semibold">Fields</h2>
              <p className="text-sm text-zinc-500">
                Each recipient needs at least one field before Send. x, y,
                width, and height are percents of the page (0-100).
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
            <Button type="button" disabled={busy} onClick={saveField}>
              Add field
            </Button>
          </section>

          <PdfBurnPreview offerId={id} key={previewKey} />

          <div className="rounded-xl border border-zinc-200 bg-white p-5">
            <p className="text-sm text-zinc-600">
              Send the signature request. ZSign emails every Recipient. Signing
              opens at{" "}
              <code className="text-xs">/sign/&#123;token&#125;</code>.
            </p>
            {missingFieldRecipients.length ? (
              <p className="mt-2 text-xs text-amber-700">
                Place a field for:{" "}
                {missingFieldRecipients.map(recipientLabel).join(", ")}
              </p>
            ) : null}
            <Button
              type="button"
              className="mt-3"
              disabled={
                busy ||
                !recipients.length ||
                missingFieldRecipients.length > 0
              }
              onClick={send}
            >
              Send
            </Button>
          </div>
        </>
      ) : offer.status === "completed" ? (
        <p className="text-sm text-zinc-600">
          This signature request is completed.
        </p>
      ) : (
        <div className="space-y-3 rounded-xl border border-zinc-200 bg-white p-5">
          <p className="text-sm text-zinc-600">
            Sent. Open signing for each recipient in a new tab.
          </p>
          <ul className="space-y-2">
            {recipients.map((r) => (
              <li key={r.id}>
                <Button
                  type="button"
                  variant="outline"
                  disabled={busy || !r.id}
                  onClick={() => void openSigner(r)}
                >
                  Open signing · {recipientLabel(r)}
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
