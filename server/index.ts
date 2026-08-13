import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import express from "express";
import { apiRouter, webhookHandler } from "./api.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
dotenv.config({ path: path.join(root, ".env") });
dotenv.config({ path: path.join(root, ".env.local"), override: true });

async function main() {
  const app = express();
  app.set("trust proxy", true);

  app.post(
    "/api/webhooks/zsign",
    express.raw({ type: "*/*" }),
    (req, res) => webhookHandler(req, res),
  );

  app.use(express.json({ limit: "2mb" }));
  app.use("/api", apiRouter());

  const isProd = process.env.NODE_ENV === "production";
  if (!isProd) {
    const { createServer } = await import("vite");
    const vite = await createServer({
      root,
      server: { middlewareMode: true, allowedHosts: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const dist = path.join(root, "dist");
    app.use(express.static(dist));
    app.get("*", (req, res, next) => {
      if (req.path.startsWith("/api")) return next();
      res.sendFile(path.join(dist, "index.html"));
    });
  }

  const port = Number(process.env.PORT || 5173);
  const host = process.env.HOSTNAME || process.env.HOST || "0.0.0.0";
  app.listen(port, host, () => {
    console.log(`API quickstart listening on ${host}:${port}`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
