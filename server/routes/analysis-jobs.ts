import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { getCookie } from "hono/cookie";
import {
  reserveAnalysisSchema,
  analysisOperationSchema,
  completeAnalysisSchema,
} from "../../shared/contracts/analysis-job";
import { getLocalGuestPolicy, LOCAL_SESSION_COOKIE } from "../config/guest";
import { readGuestUsage } from "../services/guest-session";
import { changeJob, reserveJob } from "../repositories/analysis-jobs";
import type { ApiEnvironment } from "../types";

export const analysisJobRoutes = new Hono<ApiEnvironment>();
analysisJobRoutes.use("*", bodyLimit({ maxSize: 1024 }));
analysisJobRoutes.post("/:action?", async (c) => {
  const policy = getLocalGuestPolicy(c.env, c.req.url);
  if (!policy)
    return c.json(
      {
        error: {
          code: "guest_unavailable",
          message: "Guest analysis is not configured on this deployment yet.",
        },
      },
      503,
    );
  if (
    c.req.header("Origin") !== policy.appOrigin ||
    c.req.header("Sec-Fetch-Site") === "cross-site"
  )
    return c.json(
      {
        error: {
          code: "invalid_origin",
          message: "Use the app to start analysis.",
        },
      },
      403,
    );
  if (c.req.header("Content-Type")?.split(";")[0].trim() !== "application/json")
    return c.json(
      { error: { code: "invalid_request", message: "Expected JSON." } },
      415,
    );
  const now = Math.floor(Date.now() / 1000);
  const usage = await readGuestUsage(
    policy.db,
    getCookie(c, LOCAL_SESSION_COOKIE),
    now,
  );
  if (!usage)
    return c.json(
      {
        error: {
          code: "session_required",
          message:
            "Your guest session expired. Return to Import to start again.",
        },
      },
      401,
    );
  const body: unknown = await c.req.json().catch(() => null);
  const action = c.req.param("action");
  if (!action) {
    const parsed = reserveAnalysisSchema.safeParse(body);
    if (!parsed.success)
      return c.json(
        {
          error: {
            code: "invalid_request",
            message: "Choose a source file no larger than 2 GB.",
          },
        },
        400,
      );
    const job = await reserveJob(policy.db, usage.guest.id, parsed.data, now);
    if (!job)
      return c.json(
        {
          error: {
            code: "allowance_exhausted",
            message:
              "Your three video slots are used or reserved by another analysis.",
          },
        },
        409,
      );
    return c.json(job);
  }
  const operation = (
    action === "complete" ? completeAnalysisSchema : analysisOperationSchema
  ).safeParse(body);
  if (
    !["heartbeat", "complete", "cancel"].includes(action) ||
    !operation.success
  )
    return c.json(
      {
        error: {
          code: "invalid_request",
          message: "Invalid analysis operation.",
        },
      },
      400,
    );
  const job = await changeJob(
    policy.db,
    usage.guest.id,
    operation.data.id,
    action as "heartbeat" | "complete" | "cancel",
    now,
    action === "complete"
      ? completeAnalysisSchema.parse(body).timings
      : undefined,
  );
  if (!job)
    return c.json(
      { error: { code: "not_found", message: "Analysis job not found." } },
      404,
    );
  return c.json(job);
});
