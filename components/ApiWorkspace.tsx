"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/client";
import { recipientLabel, type Offer } from "@/lib/offers-shared";
import type { DocumentRow } from "@/lib/documents";
import { useLiveEvents } from "@/lib/use-live-events";
import { DocumentsPanel } from "@/components/DocumentsPanel";
import { RequestsPanel } from "@/components/RequestsPanel";
import { ResumeDrafts } from "@/components/ResumeDrafts";
import { OfferForm } from "@/components/OfferForm";
import { Button } from "@/components/ui/button";

type Surface =
  | "documents"
  | "requests"
  | "requests-drafts"
  | "requests-sent"
  | "requests-received"
  | "builder"
  | "builder-new"
  | "signer";

type StepDef = {
  id: Surface;
  label: string;
  api: string;
  needsDraft?: boolean;
  needsSent?: boolean;
  needsRecipientEmail?: boolean;
  needsDocumentId?: boolean;
};

const SECTIONS: { title: string; blurb: string; steps: StepDef[] }[] = [
  {
    title: "Documents",
    blurb: "Upload the PDF first. Builder needs a documentId.",
    steps: [
      {
        id: "documents",
        label: "Open Documents",
        api: "GET /external/documents · POST /external/documents",
      },
    ],
  },
  {
    title: "Builder",
    blurb: "Create the request, add recipients and fields, then Send.",
    steps: [
      {
        id: "builder-new",
        label: "New from documentId",
        api: "POST /external/signature-requests { documentId, title }",
      },
      {
        id: "builder",
        label: "Resume draft",
        api: "GET/POST fields · GET preview · POST send",
        needsDraft: true,
      },
    ],
  },
  {
    title: "Signature requests",
    blurb: "After Send (or while drafting), list status from the API.",
    steps: [
      {
        id: "requests",
        label: "All",
        api: "GET /external/signature-requests",
      },
      {
        id: "requests-drafts",
        label: "Drafts",
        api: "GET /external/signature-requests?status=draft",
      },
      {
        id: "requests-sent",
        label: "Sent",
        api: "GET /external/signature-requests (non-draft)",
      },
      {
        id: "requests-received",
        label: "Received",
        api: "Same list, scoped by recipient email",
        needsRecipientEmail: true,
      },
    ],
  },
  {
    title: "Signer",
    blurb: "After Send, open /sign/{token} in a tab.",
    steps: [
      {
        id: "signer",
        label: "Open signer",
        api: "Mint recipient URL, rewrite to /sign/{token}",
        needsSent: true,
      },
    ],
  },
];

export function ApiWorkspace() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [surface, setSurface] = useState<Surface>("documents");
  const [requestId, setRequestId] = useState("");
  const [documentId, setDocumentId] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [signError, setSignError] = useState("");
  const [signBusy, setSignBusy] = useState(false);

  const queryClient = useQueryClient();
  const offersQ = useQuery({
    queryKey: ["offers"],
    queryFn: () => api<{ offers: Offer[] }>("/api/offers"),
    // SSE (below) pushes real updates; this interval is just a fallback in
    // case the stream drops, so it stays slow and stops entirely on error.
    refetchInterval: (query) => (query.state.status === "error" ? false : 20000),
  });
  const docsQ = useQuery({
    queryKey: ["documents"],
    queryFn: () => api<{ documents: DocumentRow[] }>("/api/documents"),
  });
  useLiveEvents(
    useCallback(() => {
      queryClient.invalidateQueries({ queryKey: ["offers"] });
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    }, [queryClient]),
  );

  const offers = offersQ.data?.offers ?? [];
  const documents = docsQ.data?.documents ?? [];
  const drafts = offers.filter((o) => o.status === "draft");
  const sent = offers.filter((o) => o.status !== "draft");

  const activeStep = useMemo(() => {
    for (const section of SECTIONS) {
      const step = section.steps.find((s) => s.id === surface);
      if (step) return step;
    }
    return null;
  }, [surface]);

  const loadSurface = useCallback(
    (next: Surface, nextRequestId?: string, nextDocId?: string) => {
      setSurface(next);
      setSignError("");
      if (nextRequestId !== undefined) setRequestId(nextRequestId);
      if (nextDocId !== undefined) setDocumentId(nextDocId);

      const params = new URLSearchParams(searchParams.toString());
      params.set("surface", next);
      const rid = nextRequestId !== undefined ? nextRequestId : undefined;
      const did = nextDocId !== undefined ? nextDocId : undefined;
      if (rid) params.set("requestId", rid);
      else if (nextRequestId === "") params.delete("requestId");
      if (did) params.set("documentId", did);
      else if (nextDocId === "") params.delete("documentId");
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const urlSurface = searchParams.get("surface") || "";
  const urlRequestId = searchParams.get("requestId")?.trim() || "";
  const urlDoc = searchParams.get("documentId")?.trim() || "";
  const urlEmail = searchParams.get("recipientEmail")?.trim() || "";

  useEffect(() => {
    if (urlEmail) setRecipientEmail(urlEmail);
    if (urlDoc) setDocumentId(urlDoc);
    if (urlRequestId) setRequestId(urlRequestId);
    if (!urlSurface) return;
    const valid = SECTIONS.flatMap((s) => s.steps).some((s) => s.id === urlSurface);
    if (valid) setSurface(urlSurface as Surface);
  }, [urlSurface, urlRequestId, urlDoc, urlEmail]);

  const receivedRows = offers.filter((o) => {
    if (o.status === "draft") return false;
    const email = recipientEmail.trim().toLowerCase();
    if (!email) return false;
    if (o.recipients.some((r) => r.email.toLowerCase() === email)) return true;
    return o.candidateEmail.toLowerCase() === email;
  });

  const signerRecipients =
    offers.find((o) => o.id === requestId)?.recipients ?? [];

  async function openSigner(recipientId?: string) {
    if (!requestId) {
      setSignError("Pick a sent signature request.");
      return;
    }
    setSignBusy(true);
    setSignError("");
    try {
      const { url } = await api<{ url: string }>(
        `/api/offers/${requestId}/sign-url`,
        {
          method: "POST",
          body: JSON.stringify(recipientId ? { recipientId } : {}),
        },
      );
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (err) {
      setSignError((err as Error).message);
    } finally {
      setSignBusy(false);
    }
  }

  let main: ReactNode = null;
  if (surface === "documents") {
    main = (
      <DocumentsPanel
        onPick={(id) => {
          setDocumentId(id);
        }}
      />
    );
  } else if (surface === "requests") {
    main = (
      <RequestsPanel
        title="Signature requests"
        apiHint="GET /external/signature-requests"
        rows={offers}
        loading={offersQ.isLoading}
        selectedId={requestId}
        onSelect={(id) => setRequestId(id)}
        empty="No signature requests yet."
      />
    );
  } else if (surface === "requests-drafts") {
    main = (
      <RequestsPanel
        title="Drafts"
        apiHint="GET /external/signature-requests?status=draft"
        rows={drafts}
        loading={offersQ.isLoading}
        selectedId={requestId}
        onSelect={(id) => loadSurface("builder", id)}
        empty="No drafts."
      />
    );
  } else if (surface === "requests-sent") {
    main = (
      <RequestsPanel
        title="Sent"
        apiHint="GET /external/signature-requests (omit status)"
        rows={sent}
        loading={offersQ.isLoading}
        selectedId={requestId}
        onSelect={(id) => setRequestId(id)}
        empty="No sent signature requests."
      />
    );
  } else if (surface === "requests-received") {
    main = (
      <RequestsPanel
        title="Received"
        apiHint="Org list filtered by recipient email"
        rows={receivedRows}
        loading={offersQ.isLoading}
        selectedId={requestId}
        onSelect={(id) => setRequestId(id)}
        empty={
          recipientEmail.trim()
            ? "No signature requests for that recipient."
            : "Enter a recipient email in the sidebar."
        }
      />
    );
  } else if (surface === "builder-new") {
    main = (
      <OfferForm
        documentId={documentId}
        documents={documents}
        onDocumentId={setDocumentId}
        onCreated={(id) => {
          setRequestId(id);
          loadSurface("builder", id);
          void offersQ.refetch();
        }}
      />
    );
  } else if (surface === "builder") {
    main = (
      <ResumeDrafts
        drafts={drafts}
        loading={offersQ.isLoading}
        selectedId={requestId}
        onSelect={(id) => loadSurface("builder", id)}
      />
    );
  } else if (surface === "signer") {
    main = (
      <div className="space-y-3 rounded-xl border border-zinc-200 bg-white p-5">
        <h2 className="text-lg font-semibold">Signer</h2>
        <p className="text-sm text-zinc-500">
          Opens the hosted signing page in a tab (
          <code className="text-xs">/sign/{"{token}"}</code>
          ), not an iframe.
        </p>
        {signError ? <p className="text-sm text-red-600">{signError}</p> : null}
        {signerRecipients.length > 1 ? (
          <ul className="space-y-2">
            {signerRecipients.map((r) => (
              <li key={r.id}>
                <Button
                  type="button"
                  variant="outline"
                  disabled={signBusy || !requestId || !r.id}
                  onClick={() => void openSigner(r.id)}
                >
                  {signBusy ? "Opening..." : `Open signing · ${recipientLabel(r)}`}
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <Button
            type="button"
            disabled={signBusy || !requestId}
            onClick={() => void openSigner()}
          >
            {signBusy ? "Opening..." : "Open signing"}
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,280px)_1fr] lg:items-start">
      <div className="space-y-4">
        {SECTIONS.map((section) => (
          <section
            key={section.title}
            className="rounded-xl border border-zinc-200 bg-white p-4"
          >
            <h2 className="text-sm font-semibold text-zinc-900">
              {section.title}
            </h2>
            <p className="mt-1 text-xs text-zinc-500">{section.blurb}</p>
            <ul className="mt-3 space-y-2">
              {section.steps.map((step) => (
                <li key={step.id}>
                  <button
                    type="button"
                    onClick={() => loadSurface(step.id)}
                    className={`w-full rounded-md px-3 py-2 text-left text-sm ${
                      surface === step.id
                        ? "bg-zinc-900 text-white"
                        : "bg-zinc-50 text-zinc-800 ring-1 ring-zinc-200 hover:bg-zinc-100"
                    }`}
                  >
                    {step.label}
                  </button>
                  {surface === step.id && (
                    <p className="mt-1 text-[11px] text-zinc-500">{step.api}</p>
                  )}
                </li>
              ))}
            </ul>
          </section>
        ))}

        {(activeStep?.needsSent || activeStep?.needsRecipientEmail) && (
          <section className="rounded-xl border border-zinc-200 bg-white p-4 space-y-3">
            {activeStep?.needsRecipientEmail ? (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-zinc-900">
                  Received as (recipient email)
                </h3>
                <Input
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  placeholder="recipient@example.com"
                  className="text-sm"
                />
              </div>
            ) : null}

            {activeStep?.needsSent ? (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-zinc-900">
                  Sent signature request
                </h3>
                <select
                  className="w-full rounded-md border border-zinc-300 px-2 py-2 text-sm"
                  value={requestId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setRequestId(id);
                    const picked = offers.find((r) => r.id === id);
                    if (picked?.candidateEmail) {
                      setRecipientEmail(picked.candidateEmail);
                    }
                  }}
                >
                  <option value="">
                    {sent.length
                      ? "Select sent request..."
                      : "No sent requests yet"}
                  </option>
                  {sent.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.title} ({r.status})
                      {r.candidateEmail ? ` · ${r.candidateEmail}` : ""}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
          </section>
        )}
      </div>

      <div className="space-y-3 min-w-0">
        <p className="text-sm font-medium text-zinc-900">
          HTTP {activeStep ? ` · ${activeStep.label}` : ""}
        </p>
        {main}
      </div>
    </div>
  );
}
