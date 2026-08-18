import { Suspense } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { getQueryClient } from "@/lib/query/get-query-client";
import { AppShell } from "@/components/AppShell";
import { ConnectionPanel } from "@/components/ConnectionPanel";
import { ApiWorkspace } from "@/components/ApiWorkspace";

export function ApiApp() {
  const queryClient = getQueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <AppShell>
        <ConnectionPanel />
        <Suspense fallback={<p className="text-sm text-zinc-500">Loading...</p>}>
          <ApiWorkspace />
        </Suspense>
      </AppShell>
    </QueryClientProvider>
  );
}
