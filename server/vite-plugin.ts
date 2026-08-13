import type { Plugin } from "vite";
import express from "express";
import { apiRouter, webhookHandler } from "./api.ts";

function apiApp() {
  const app = express();
  app.post(
    "/api/webhooks/zsign",
    express.raw({ type: "*/*" }),
    webhookHandler,
  );
  app.use(express.json({ limit: "2mb" }));
  app.use("/api", apiRouter());
  return app;
}

function mountApi(): express.Express {
  return apiApp();
}

export function zsignApiPlugin(): Plugin {
  const app = mountApi();
  const intercept: Plugin["configureServer"] = (server) => {
    server.middlewares.use((req, res, next) => {
      const path = (req.url || "").split("?")[0];
      if (path.startsWith("/api")) {
        app(req, res, next);
        return;
      }
      next();
    });
  };
  return {
    name: "zsign-api",
    configureServer: intercept,
    configurePreviewServer: intercept,
  };
}
