import type { APIRoute } from "astro";
import { subscribe } from "@/lib/events";

export const prerender = false;

const HEARTBEAT_MS = 15000;

export const GET: APIRoute = async ({ request }) => {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const send = (type: string) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type })}\n\n`));
      };
      const unsubscribe = subscribe(send);
      const heartbeat = setInterval(() => {
        controller.enqueue(encoder.encode(`: ping\n\n`));
      }, HEARTBEAT_MS);

      const close = () => {
        clearInterval(heartbeat);
        unsubscribe();
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      };
      request.signal.addEventListener("abort", close);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
};
