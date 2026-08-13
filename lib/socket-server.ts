import type { Server as IOServer } from "socket.io";

declare global {
  var __zsignIo: IOServer | undefined;
}

export function getIO(): IOServer | null {
  return globalThis.__zsignIo ?? null;
}
