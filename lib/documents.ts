import { zsignJson } from "@/lib/zsign";

export type DocumentRow = {
  id: string;
  name: string;
  createdAt?: string;
};

type ListResponse = {
  data?: { id: string; name?: string; filename?: string; createdAt?: string }[];
};

export async function listDocuments(): Promise<DocumentRow[]> {
  const res = await zsignJson<ListResponse>("documents?limit=50");
  return (res.data || []).map((d) => ({
    id: d.id,
    name: d.name || d.filename || "Document",
    createdAt: d.createdAt,
  }));
}
