import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { fetchJson } from "@/lib/fetch-json";
import { recipientLabel, type Offer, type OfferRecipient } from "@/lib/offers-shared";

const STATUS: Record<string, string> = {
  draft: "Draft",
  pending: "Sent",
  completed: "Completed",
  declined: "Declined",
  canceled: "Canceled",
  expired: "Expired",
};

type Props = {
  requestId: string;
};

export function SendForm({ requestId }: Props) {
  const [offer, setOffer] = useState<Offer | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchJson<{ offer: Offer }>(`/api/signature-requests/${requestId}`);
      setOffer(data.offer);
    } catch (err) {
      setError((err as Error).message);
      setOffer(null);
    } finally {
      setLoading(false);
    }
  }, [requestId]);

  useEffect(() => {
    void load();
  }, [load]);

  const recipients = offer?.recipients ?? [];
  const fields = offer?.fields ?? [];

  const missingFieldRecipients = useMemo(() => {
    const withField = new Set(
      fields.map((f) => f.recipientId).filter(Boolean) as string[],
    );
    return recipients.filter((r) => r.id && !withField.has(r.id));
  }, [fields, recipients]);

  async function send() {
    setBusy(true);
    setError("");
    try {
      const data = await fetchJson<{ offer: Offer }>(
        `/api/signature-requests/${requestId}/send`,
        { method: "POST" },
      );
      setOffer(data.offer);
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
      const { url } = await fetchJson<{ url: string }>(
        `/api/signature-requests/${requestId}/sign-url`,
        {
          method: "POST",
          body: JSON.stringify({ recipientId: recipient.id }),
        },
      );
      window.open(url, "_blank", "noopener,noreferrer");
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

  const statusLabel = STATUS[offer.status] || offer.status;

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-zinc-200 bg-white p-5">
        <p className="text-xs uppercase tracking-wide text-zinc-500">
          Signature request
        </p>
        <h2 className="text-lg font-semibold">{offer.title}</h2>
        <p className="mt-2 text-sm">
          Status: <strong>{statusLabel}</strong>
          {" · "}
          {recipients.length} recipient{recipients.length === 1 ? "" : "s"}
        </p>
      </div>

      {offer.status === "draft" ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <p className="text-sm text-zinc-600">
            Send the signature request. ZSign emails every recipient. Signing
            opens at <code className="text-xs">/sign/&#123;token&#125;</code>.
          </p>
          {missingFieldRecipients.length ? (
            <p className="mt-2 text-xs text-amber-700">
              Place a field for:{" "}
              {missingFieldRecipients.map(recipientLabel).join(", ")}.{" "}
              <a
                href={`/signature-requests/${requestId}/fields`}
                className="font-medium underline"
              >
                Edit fields
              </a>
            </p>
          ) : null}
          <Button
            type="button"
            className="mt-3"
            disabled={
              busy || !recipients.length || missingFieldRecipients.length > 0
            }
            onClick={() => void send()}
          >
            {busy ? "Sending..." : "Send"}
          </Button>
        </div>
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
