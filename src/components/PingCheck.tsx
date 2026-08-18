import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type Status = { state: "loading" } | { state: "ok" } | { state: "fail"; message: string };

export function PingCheck() {
  const [status, setStatus] = useState<Status>({ state: "loading" });
  const [apiBase, setApiBase] = useState("");

  useEffect(() => {
    fetch("/api/ping")
      .then(async (res) => {
        const body = await res.json();
        if (body.apiBase) setApiBase(body.apiBase);
        if (!res.ok) throw new Error(body.message || `HTTP ${res.status}`);
        setStatus({ state: "ok" });
      })
      .catch((err: Error) => setStatus({ state: "fail", message: err.message }));
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Connection</CardTitle>
        <CardDescription>
          Paste <code>ZSIGN_API_KEY</code> in <code>.env</code> (your org only). Never sent to
          ZSign from the browser.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <dl className="text-sm">
          <dt className="text-xs font-medium text-zinc-500">Ping</dt>
          <dd
            className={
              status.state === "ok"
                ? "text-green-700"
                : status.state === "fail"
                  ? "text-red-600"
                  : "text-zinc-500"
            }
          >
            {status.state === "loading" && "Checking..."}
            {status.state === "ok" && "API key works (GET /external/ping)"}
            {status.state === "fail" && status.message}
          </dd>
        </dl>
        {apiBase ? (
          <p className="mt-3 text-xs text-zinc-500">
            Base URL: <code className="font-mono text-[11px] text-zinc-700">{apiBase}</code>
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
