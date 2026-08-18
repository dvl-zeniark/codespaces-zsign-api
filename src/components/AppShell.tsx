import { WebhookInbox } from "@/components/WebhookInbox";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-950">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-4 py-3">
          <div>
            <p className="text-lg font-semibold tracking-tight">API quickstart</p>
            <p className="text-xs text-zinc-500">
              Custom builder on your server · no iframe
            </p>
          </div>
          <p className="text-xs text-zinc-500">
            <code className="text-[11px]">src/lib/zsign.ts</code>
            {" · "}
            <code className="text-[11px]">src/lib/fields.ts</code>
          </p>
        </div>
      </header>
      <main className="mx-auto flex max-w-[1400px] flex-col gap-4 px-4 py-4">
        {children}
        <WebhookInbox />
      </main>
    </div>
  );
}
