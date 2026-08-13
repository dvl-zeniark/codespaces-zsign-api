"use client";

import { io, type Socket } from "socket.io-client";

function noopSocket(): Socket {
  return {
    on() {
      return this;
    },
    off() {
      return this;
    },
  } as unknown as Socket;
}

export const socket: Socket =
  typeof window === "undefined"
    ? noopSocket()
    : io({ autoConnect: true, path: "/socket.io" });
