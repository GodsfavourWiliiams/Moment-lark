import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { getCookie, setCookie } from "hono/cookie";
import { guestSessionRequestSchema } from "../../shared/contracts/guest";
import {
  getLocalGuestPolicy,
  LOCAL_SESSION_COOKIE,
  SESSION_LIFETIME_SECONDS,
} from "../config/guest";
import { getOrCreateGuest, readGuestUsage } from "../services/guest-session";
import type { ApiEnvironment } from "../types";

export const guestRoutes = new Hono<ApiEnvironment>();

guestRoutes.use("*", async (c, next) => {
  if (!getLocalGuestPolicy(c.env, c.req.url)) {
    return c.json(
      {
        error: {
          code: "guest_unavailable",
          message: "Guest sessions are not available on this deployment yet.",
        },
      },
      503,
    );
  }
  // Reject cross-site requests even for reads; API responses never enable CORS.
  if (c.req.header("Sec-Fetch-Site") === "cross-site") {
    return c.json(
      {
        error: {
          code: "invalid_origin",
          message: "Use the app to access your guest session.",
        },
      },
      403,
    );
  }
  await next();
});

guestRoutes.post(
  "/session",
  bodyLimit({
    maxSize: 1024,
    onError: (c) =>
      c.json(
        { error: { code: "body_too_large", message: "Request is too large." } },
        413,
      ),
  }),
  async (c) => {
    const policy = getLocalGuestPolicy(c.env, c.req.url)!;
    // A cookie is ambient authority. Require our exact configured app origin on mutations.
    if (c.req.header("Origin") !== policy.appOrigin) {
      return c.json(
        {
          error: {
            code: "invalid_origin",
            message: "Use the app to create your guest session.",
          },
        },
        403,
      );
    }
    if (
      c.req.header("Content-Type")?.split(";")[0].trim() !== "application/json"
    ) {
      return c.json(
        {
          error: {
            code: "invalid_content_type",
            message: "Expected a JSON request.",
          },
        },
        415,
      );
    }
    const body = await c.req.json().catch(() => null);
    if (!guestSessionRequestSchema.safeParse(body).success) {
      return c.json(
        {
          error: {
            code: "invalid_request",
            message:
              "Guest creation does not accept profile or allowance fields.",
          },
        },
        400,
      );
    }
    const { usage, newToken } = await getOrCreateGuest(
      policy.db,
      getCookie(c, LOCAL_SESSION_COOKIE),
      policy.allowanceSeconds,
      Math.floor(Date.now() / 1000),
    );
    if (newToken) {
      setCookie(c, LOCAL_SESSION_COOKIE, newToken, {
        httpOnly: true,
        sameSite: "Strict",
        path: "/",
        maxAge: SESSION_LIFETIME_SECONDS,
        // HTTP is permitted only by the explicit loopback-only local policy above.
        secure: new URL(c.req.url).protocol === "https:",
      });
    }
    return c.json(usage, newToken ? 201 : 200);
  },
);

guestRoutes.get("/usage", async (c) => {
  const policy = getLocalGuestPolicy(c.env, c.req.url)!;
  const usage = await readGuestUsage(
    policy.db,
    getCookie(c, LOCAL_SESSION_COOKIE),
    Math.floor(Date.now() / 1000),
  );
  if (!usage)
    return c.json(
      {
        error: {
          code: "session_required",
          message: "Start a guest session to see your allowance.",
        },
      },
      401,
    );
  return c.json(usage);
});
