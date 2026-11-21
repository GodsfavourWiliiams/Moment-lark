import { analysisJobRoutes } from "./routes/analysis-jobs";
import { Hono } from "hono";
import { guestRoutes } from "./routes/guest";
import { maintainGuestRecords } from "./services/maintenance";
import type { Bindings } from "./types";
import type { ApiEnvironment } from "./types";

const app = new Hono<ApiEnvironment>();

app.use("/api/*", async (c, next) => {
  c.header("Cache-Control", "no-store");
  c.header("X-Content-Type-Options", "nosniff");
  await next();
});
app.get("/api/health", (c) => c.json({ status: "ok" }));
app.route("/api/guest", guestRoutes);
app.route("/api/analysis-jobs", analysisJobRoutes);
app.all("/api/*", (c) =>
  c.json(
    { error: { code: "not_found", message: "API endpoint not found." } },
    404,
  ),
);
app.all("/api", (c) =>
  c.json(
    { error: { code: "not_found", message: "API endpoint not found." } },
    404,
  ),
);
app.all("*", (c) =>
  c.env.ASSETS ? c.env.ASSETS.fetch(c.req.raw) : c.notFound(),
);
app.onError((_error, c) => {
  // Do not expose SQL errors, session tokens, or request details to clients/logs.
  return c.json(
    {
      error: {
        code: "service_unavailable",
        message: "Guest service is unavailable. Please try again.",
      },
    },
    503,
  );
});

export default Object.assign(app, {
  async scheduled(_event: ScheduledController, env: Bindings) {
    if (env.GUEST_MODE === "public" && env.DB)
      await maintainGuestRecords(env.DB, Math.floor(Date.now() / 1000));
  },
});
