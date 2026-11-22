import { Hono } from "hono";
import {
  MODEL_WEIGHT_ASSETS,
  RANK_MODEL_PROXY_PREFIX,
  RANK_MODEL_UPSTREAM_URL,
} from "../../src/lib/analysis/models";
import type { ApiEnvironment } from "../types";

const byPath = new Map<string, string>(
  MODEL_WEIGHT_ASSETS.map((asset) => [asset.local, asset.remote]),
);

export function modelWeightRoutes(fetchFile: typeof fetch = fetch) {
  const app = new Hono<ApiEnvironment>();
  app.on(["GET", "HEAD"], "/*", async (c) => {
    const rankFile = c.req.path.startsWith(RANK_MODEL_PROXY_PREFIX)
      ? c.req.path.slice(RANK_MODEL_PROXY_PREFIX.length)
      : "";
    const remote =
      byPath.get(c.req.path) ||
      (/^[\w.-]+\.(?:json|bin|model)$/.test(rankFile)
        ? RANK_MODEL_UPSTREAM_URL + rankFile
        : undefined);
    if (!remote) return c.notFound();
    let upstream: Response;
    try {
      upstream = await fetchFile(remote, { method: c.req.method });
    } catch {
      return c.text("Model host is unavailable. Please retry.", 502);
    }
    if (!upstream.ok || (c.req.method === "GET" && !upstream.body))
      return c.text("Model host is unavailable. Please retry.", 502);
    const headers = new Headers({
      "Content-Type": rankFile.endsWith(".json")
        ? "application/json"
        : "application/octet-stream",
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    });
    const length = upstream.headers.get("content-length");
    if (length) headers.set("Content-Length", length);
    return new Response(c.req.method === "HEAD" ? null : upstream.body, {
      headers,
    });
  });
  return app;
}
