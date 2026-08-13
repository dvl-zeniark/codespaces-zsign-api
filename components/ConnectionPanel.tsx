"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/client";

export function ConnectionPanel() {
  const [webhookUrl, setWebhookUrl] = useState("");
  const [ping, setPing] = useState<"loading" | "ok" | "fail">("loading");
  const [pingDetail, setPingDetail] = useState("");

  useEffect(() => {
    setWebhookUrl(`${window.location.origin}/api/webhooks/zsign`);
    api<{ ok?: boolean }>("/api/ping")
      .then(() => {
        setPing("ok");
        setPingDetail("API key works (GET /external/ping)");
      })
      .catch((err) => {
        setPing("fail");
        setPingDetail((err as Error).message);
      });
  }, []);

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-4">
      <h2 className="text-sm font-semibold text-zinc-900">Connection</h2>
      <p className="mt-1 text-xs text-zinc-500">
        Paste <code className="text-[11px]">ZSIGN_API_KEY</code> and webhook
        secret in <code className="text-[11px]">.env</code> (your org only).
        Never sent to ZSign from the browser.
      </p>
      <dl className="mt-3 space-y-2 text-sm">
        <div>
          <dt className="text-xs font-medium text-zinc-500">Ping</dt>
          <dd className="text-zinc-800">
            {ping === "loading" ? "Checking..." : null}
            {ping === "ok" ? (
              <span className="text-green-700">{pingDetail}</span>
            ) : null}
            {ping === "fail" ? (
              <span className="text-red-600">{pingDetail}</span>
            ) : null}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-zinc-500">Webhook receive URL</dt>
          <dd className="font-mono text-xs text-zinc-800">{webhookUrl || "..."}</dd>
        </div>
      </dl>
    </section>
  );
}
