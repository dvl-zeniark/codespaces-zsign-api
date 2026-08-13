"use client";

import { HydrationBoundary, QueryClientProvider, dehydrate } from "@tanstack/react-query";
import { getQueryClient } from "@/lib/query/get-query-client";

export function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

/** Optional server-prefetch wrapper for pages. */
export function PrefetchInbox({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      {children}
    </HydrationBoundary>
  );
}
