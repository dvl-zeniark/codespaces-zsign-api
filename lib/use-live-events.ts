"use client";

import { useEffect, useRef } from "react";

/** Subscribes to /api/events (SSE) and invokes the latest onEvent on each push. */
export function useLiveEvents(onEvent: () => void) {
  const handler = useRef(onEvent);
  handler.current = onEvent;

  useEffect(() => {
    const source = new EventSource("/api/events");
    source.onmessage = () => handler.current();
    return () => source.close();
  }, []);
}
