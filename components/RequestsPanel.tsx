"use client";

import { recipientSummary, type Offer } from "@/lib/offers";

const STATUS: Record<string, string> = {
  draft: "Draft",
  pending: "Sent",
  completed: "Completed",
  declined: "Declined",
  canceled: "Canceled",
  expired: "Expired",
};

type Props = {
  title: string;
  apiHint: string;
  rows: Offer[];
  loading?: boolean;
  selectedId?: string;
  onSelect: (id: string) => void;
  empty: string;
};

export function RequestsPanel({
  title,
  apiHint,
  rows,
  loading,
  selectedId,
  onSelect,
  empty,
}: Props) {
  return (
    <div className="space-y-4 rounded-xl border border-zinc-200 bg-white p-5">
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="text-sm text-zinc-500">{apiHint}</p>
      </div>
      {loading ? (
        <p className="text-sm text-zinc-500">Loading signature requests...</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-zinc-500">{empty}</p>
      ) : (
        <ul className="divide-y divide-zinc-100 rounded-md border border-zinc-200">
          {rows.map((r) => (
            <li key={r.id}>
              <button
                type="button"
                onClick={() => onSelect(r.id)}
                className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm ${
                  selectedId === r.id ? "bg-zinc-900 text-white" : "hover:bg-zinc-50"
                }`}
              >
                <span className="min-w-0">
                  <span className="block font-medium truncate">{r.title}</span>
                  <span
                    className={`block text-xs truncate ${
                      selectedId === r.id ? "text-zinc-300" : "text-zinc-500"
                    }`}
                  >
                    {recipientSummary(r)}
                  </span>
                </span>
                <span className="shrink-0 text-xs">
                  {STATUS[r.status] || r.status}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
