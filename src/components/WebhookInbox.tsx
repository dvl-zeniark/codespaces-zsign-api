import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/client";
import { useLiveEvents } from "@/lib/use-live-events";

type InboxRow = {
  type: string;
  at: string;
};

export function WebhookInbox() {
  const [rows, setRows] = useState<InboxRow[]>([]);

  const refresh = useCallback(async () => {
    try {
      const data = await api<{ events: InboxRow[] }>("/api/webhooks/inbox");
      setRows(data.events || []);
    } catch {
      /* keep last */
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useLiveEvents(refresh);

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-4">
      <h2 className="text-sm font-semibold text-zinc-900">Webhook inbox</h2>
      <p className="mt-1 text-xs text-zinc-500">
        Deliveries to{" "}
        <code className="text-[11px]">POST /api/webhooks/zsign</code>
      </p>
      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-zinc-500">No events yet.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {rows.map((row, i) => (
            <li
              key={`${row.at}-${row.type}-${i}`}
              className="flex items-center justify-between gap-2 text-sm"
            >
              <span className="font-medium text-zinc-800">{row.type}</span>
              <span className="text-xs text-zinc-500">{row.at}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
