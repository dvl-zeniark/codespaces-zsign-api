"use client";

import { recipientSummary, type Offer } from "@/lib/offers";
import { OfferDetail } from "@/components/OfferDetail";

type Props = {
  drafts: Offer[];
  loading?: boolean;
  selectedId: string;
  onSelect: (id: string) => void;
};

export function ResumeDrafts({
  drafts,
  loading,
  selectedId,
  onSelect,
}: Props) {
  const selected = drafts.find((d) => d.id === selectedId);

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,280px)_1fr] xl:items-start">
      <div className="rounded-xl border border-zinc-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-zinc-900">Drafts</h2>
        <p className="mt-1 text-xs text-zinc-500">
          GET /external/signature-requests?status=draft. Click Edit to continue.
        </p>
        {loading ? (
          <p className="mt-3 text-sm text-zinc-500">Loading drafts...</p>
        ) : drafts.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-500">
            No drafts. Create one with New from documentId.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-zinc-100 rounded-md border border-zinc-200">
            {drafts.map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => onSelect(r.id)}
                  className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm ${
                    selectedId === r.id
                      ? "bg-zinc-900 text-white"
                      : "hover:bg-zinc-50"
                  }`}
                >
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{r.title}</span>
                    <span
                      className={`block truncate text-xs ${
                        selectedId === r.id ? "text-zinc-300" : "text-zinc-500"
                      }`}
                    >
                      {recipientSummary(r)}
                    </span>
                  </span>
                  <span className="shrink-0 text-xs">Edit</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      {selected ? (
        <OfferDetail id={selected.id} />
      ) : (
        <p className="text-sm text-zinc-500">
          Click a draft to edit recipients, fields, and Send.
        </p>
      )}
    </div>
  );
}
