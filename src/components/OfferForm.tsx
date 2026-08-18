import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/client";
import { MAX_RECIPIENTS, type Offer } from "@/lib/offers-shared";
import type { DocumentRow } from "@/lib/documents";

type Props = {
  documentId: string;
  documents: DocumentRow[];
  onDocumentId: (id: string) => void;
  onCreated: (id: string) => void;
};

type RecipientRow = {
  firstName: string;
  lastName: string;
  email: string;
};

type RequestMode = "single" | "bulk";

const EMPTY_ROW: RecipientRow = { firstName: "", lastName: "", email: "" };

export function OfferForm({
  documentId,
  documents,
  onDocumentId,
  onCreated,
}: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<RequestMode>("single");
  const [title, setTitle] = useState("");
  const [recipients, setRecipients] = useState<RecipientRow[]>([{ ...EMPTY_ROW }]);
  const selected = documents.find((d) => d.id === documentId) || null;

  useEffect(() => {
    if (!selected?.name) return;
    setTitle((prev) =>
      prev.trim() ? prev : selected.name.replace(/\.pdf$/i, ""),
    );
  }, [selected?.id, selected?.name]);

  function updateRow(index: number, patch: Partial<RecipientRow>) {
    setRecipients((rows) =>
      rows.map((row, i) => (i === index ? { ...row, ...patch } : row)),
    );
  }

  function cleanedRecipients(): RecipientRow[] {
    return recipients
      .map((r) => ({
        firstName: r.firstName.trim(),
        lastName: r.lastName.trim(),
        email: r.email.trim(),
      }))
      .filter((r) => r.firstName || r.lastName || r.email);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!documentId.trim()) {
      setError("Pick a Document (upload under Documents first).");
      return;
    }
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    const cleaned = cleanedRecipients();
    if (cleaned.some((r) => !r.firstName || !r.lastName || !r.email)) {
      setError("Each recipient needs first name, last name, and email.");
      return;
    }
    if (mode === "bulk" && !cleaned.length) {
      setError("Bulk send needs at least one recipient.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const { offer } = await api<{ offer: Offer }>("/api/offers", {
        method: "POST",
        body: JSON.stringify({
          roleTitle: title.trim(),
          documentId: documentId.trim(),
          recipients: cleaned,
          isBulk: mode === "bulk",
        }),
      });
      onCreated(offer.id);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-4 rounded-xl border border-zinc-200 bg-white p-5"
    >
      <div>
        <h2 className="text-lg font-semibold">New Signature Request</h2>
        <p className="text-sm text-zinc-500">
          POST /external/signature-requests {"{ documentId, title }"}. Recipients
          and fields can be added on the draft.
        </p>
      </div>

      <div>
        <p className="mb-2 text-[13px] font-semibold text-zinc-900">
          Request Type
        </p>
        <div className="grid grid-cols-2 overflow-hidden rounded-lg border border-zinc-200">
          <button
            type="button"
            className={`px-3 py-2 text-sm ${
              mode === "single"
                ? "bg-zinc-900 text-white"
                : "bg-white text-zinc-800 hover:bg-zinc-50"
            }`}
            onClick={() => setMode("single")}
          >
            Multi-Signer
          </button>
          <button
            type="button"
            className={`px-3 py-2 text-sm ${
              mode === "bulk"
                ? "bg-zinc-900 text-white"
                : "bg-white text-zinc-800 hover:bg-zinc-50"
            }`}
            onClick={() => setMode("bulk")}
          >
            Bulk Send
          </button>
        </div>
        <p className="mt-2 text-sm italic text-zinc-500">
          {mode === "single"
            ? "Send one document to multiple recipients for shared signing."
            : "Send a separate copy of the document to each recipient for signing."}
        </p>
      </div>

      <div className="space-y-1">
        <Label htmlFor="docid">Document</Label>
        <select
          id="docid"
          className="h-10 w-full rounded-lg border border-zinc-200 px-3 text-sm"
          value={documentId}
          onChange={(e) => onDocumentId(e.target.value)}
          required
        >
          <option value="">Select document...</option>
          {documents.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </div>

      {selected ? (
        <div className="flex items-center gap-3 rounded-[10px] border border-zinc-200 bg-zinc-50 px-3.5 py-3">
          <div className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-lg bg-violet-100 text-xs font-semibold text-violet-900">
            PDF
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-zinc-900">
              {selected.name}
            </p>
            <p className="mt-0.5 text-xs text-zinc-500">
              This document will be sent for signing
            </p>
          </div>
        </div>
      ) : null}

      <div className="space-y-1">
        <Label htmlFor="role">Title</Label>
        <Input
          id="role"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Q2 NDA - Acme Corp"
          maxLength={200}
          required
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-zinc-900">Recipients</h3>
          <Button
            type="button"
            variant="outline"
            disabled={recipients.length >= MAX_RECIPIENTS}
            onClick={() =>
              setRecipients((rows) =>
                rows.length >= MAX_RECIPIENTS
                  ? rows
                  : [...rows, { ...EMPTY_ROW }],
              )
            }
          >
            Add recipient
          </Button>
        </div>
        {recipients.map((row, index) => (
          <div
            key={index}
            className="grid gap-3 rounded-md border border-zinc-200 p-3 sm:grid-cols-2"
          >
            <div className="flex items-center justify-between sm:col-span-2">
              <p className="text-xs font-medium text-zinc-500">
                Recipient {index + 1}
              </p>
              {recipients.length > 1 ? (
                <button
                  type="button"
                  className="text-xs text-zinc-600 underline hover:text-zinc-900"
                  onClick={() =>
                    setRecipients((rows) => rows.filter((_, i) => i !== index))
                  }
                >
                  Remove
                </button>
              ) : null}
            </div>
            <div className="space-y-1">
              <Label htmlFor={`first-${index}`}>First name</Label>
              <Input
                id={`first-${index}`}
                value={row.firstName}
                onChange={(e) => updateRow(index, { firstName: e.target.value })}
                required={mode === "bulk"}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor={`last-${index}`}>Last name</Label>
              <Input
                id={`last-${index}`}
                value={row.lastName}
                onChange={(e) => updateRow(index, { lastName: e.target.value })}
                required={mode === "bulk"}
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor={`email-${index}`}>Email</Label>
              <Input
                id={`email-${index}`}
                type="email"
                value={row.email}
                onChange={(e) => updateRow(index, { email: e.target.value })}
                required={mode === "bulk"}
              />
            </div>
          </div>
        ))}
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <Button type="submit" disabled={busy}>
        {busy ? "Creating..." : "Create Draft"}
      </Button>
    </form>
  );
}
