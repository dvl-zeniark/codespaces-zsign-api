import { Suspense } from "react";
import { AppShell } from "@/components/AppShell";
import { ConnectionPanel } from "@/components/ConnectionPanel";
import { ApiWorkspace } from "@/components/ApiWorkspace";

export default function Home() {
  return (
    <AppShell>
      <ConnectionPanel />
      <Suspense fallback={<p className="text-sm text-zinc-500">Loading...</p>}>
        <ApiWorkspace />
      </Suspense>
    </AppShell>
  );
}
