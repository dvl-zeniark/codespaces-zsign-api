/** In-memory pub/sub so webhook receipts can push updates to open SSE streams. */
type Listener = (type: string) => void;

declare global {
  var __zsignEventBus: Set<Listener> | undefined;
}

function bus(): Set<Listener> {
  if (!globalThis.__zsignEventBus) {
    globalThis.__zsignEventBus = new Set();
  }
  return globalThis.__zsignEventBus;
}

export function emitUpdate(type: string) {
  bus().forEach((listener) => listener(type));
}

export function subscribe(listener: Listener): () => void {
  bus().add(listener);
  return () => bus().delete(listener);
}
