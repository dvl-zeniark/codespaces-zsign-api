import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fetchJson } from "@/lib/fetch-json";
import type { DocumentRow } from "@/lib/documents";

export function UploadForm() {
  const [rows, setRows] = useState<DocumentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    try {
      const data = await fetchJson<{ documents: DocumentRow[] }>("/api/documents");
      setRows(data.documents);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function upload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setError("Choose a Document (PDF)");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const body = new FormData();
      body.append("file", file);
      await fetchJson("/api/documents", { method: "POST", body });
      setFile(null);
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4 rounded-xl border border-zinc-200 bg-white p-5">
      <div>
        <h2 className="text-lg font-semibold">Documents</h2>
        <p className="text-sm text-zinc-500">
          GET /external/documents · POST /external/documents
        </p>
      </div>
      <form onSubmit={upload} className="flex flex-wrap items-end gap-3">
        <div className="min-w-[220px] flex-1 space-y-1">
          <Label htmlFor="doc">Upload PDF</Label>
          <Input
            id="doc"
            type="file"
            accept="application/pdf,.pdf"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </div>
        <Button type="submit" disabled={busy}>
          {busy ? "Uploading..." : "Upload"}
        </Button>
      </form>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {loading ? (
        <p className="text-sm text-zinc-500">Loading documents...</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-zinc-500">No documents yet.</p>
      ) : (
        <ul className="divide-y divide-zinc-100 rounded-md border border-zinc-200">
          {rows.map((d) => (
            <li key={d.id}>
              <a
                href={`/signature-requests/new?documentId=${encodeURIComponent(d.id)}`}
                className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm no-underline hover:bg-zinc-50"
              >
                <span className="truncate font-medium">{d.name}</span>
                <span className="shrink-0 font-mono text-[11px] text-zinc-500">
                  {d.id.slice(0, 8)}...
                </span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
