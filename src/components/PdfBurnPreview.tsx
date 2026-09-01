import { useCallback, useState } from "react";

type Props = {
  requestId: string;
};

export function PdfBurnPreview({ requestId }: Props) {
  const [stamp, setStamp] = useState(() => String(Date.now()));
  const src = `/api/signature-requests/${requestId}/preview?v=${stamp}`;

  const refresh = useCallback(() => {
    setStamp(String(Date.now()));
  }, []);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-zinc-800">Document preview</p>
        <button
          type="button"
          onClick={refresh}
          className="text-sm text-zinc-600 underline hover:text-zinc-900"
        >
          Refresh preview
        </button>
      </div>
      <p className="text-xs text-zinc-500">
        Preview of the Document with Fields outlined. The draft is unchanged
        until you Send.
      </p>
      <iframe
        title="Document preview"
        src={src}
        className="h-[420px] w-full rounded-md border border-zinc-300 bg-white"
      />
    </div>
  );
}
