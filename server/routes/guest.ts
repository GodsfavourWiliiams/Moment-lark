import { expireJobs } from "../repositories/analysis-jobs";
import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { getCookie, setCookie } from "hono/cookie";
import { guestSessionRequestSchema } from "../../shared/contracts/guest";
import {
  getGuestPolicy,
  TURNSTILE_ACTION,
  SESSION_LIFETIME_SECONDS,
} from "../config/guest";
import {
  digestSessionToken,
  getOrCreateGuest,
  readGuestUsage,
} from "../services/guest-session";
import {
  ensureWindow,
  networkWindow,
  takeAttempt,
  verifyTurnstile,
} from "../services/public-guest";
import type { ApiEnvironment } from "../types";
export const guestRoutes = new Hono<ApiEnvironment>();
guestRoutes.use("*", async (c, next) => {
  if (!getGuestPolicy(c.env, c.req.url))
    return c.json(
      {
        error: {
          code: "guest_unavailable",
          message: "Guest sessions are not available on this deployment yet.",
        },
      },
      503,
    );
  if (c.req.header("Sec-Fetch-Site") === "cross-site")
    return c.json(
      {
        error: {
          code: "invalid_origin",
          message: "Use the app to access your guest session.",
        },
      },
      403,
    );
  await next();
});
guestRoutes.get("/challenge", (c) => {
  const policy = getGuestPolicy(c.env, c.req.url)!;
  return policy.mode === "public"
    ? c.json({ siteKey: policy.siteKey, action: TURNSTILE_ACTION })
    : c.json(
        {
          error: {
            code: "not_required",
            message: "Local development does not require verification.",
          },
        },
        404,
      );
});
guestRoutes.post(
  "/session",
  bodyLimit({
    maxSize: 4096,
    onError: (c) =>
      c.json(
        { error: { code: "body_too_large", message: "Request is too large." } },
        413,
      ),
  }),
  async (c) => {
    const policy = getGuestPolicy(c.env, c.req.url)!;
    if (c.req.header("Origin") !== policy.appOrigin)
      return c.json(
        {
          error: {
            code: "invalid_origin",
            message: "Use the app to create your guest session.",
          },
        },
        403,
      );
    if (
      c.req.header("Content-Type")?.split(";")[0].trim() !== "application/json"
    )
      return c.json(
        {
          error: {
            code: "invalid_content_type",
            message: "Expected a JSON request.",
          },
        },
        415,
      );
    const parsed = guestSessionRequestSchema.safeParse(
      await c.req.json().catch(() => null),
    );
    if (!parsed.success)
      return c.json(
        {
          error: {
            code: "invalid_request",
            message: "Guest creation accepts only a verification token.",
          },
        },
        400,
      );
    const now = Math.floor(Date.now() / 1000);
    const cookie = getCookie(c, policy.cookie);
    const existing = await readGuestUsage(policy.db, cookie, now, policy.mode);
    if (existing) return c.json(existing);
    let publicContext:
      | { tokenDigest: string; networkWindow: string }
      | undefined;
    if (policy.mode === "public") {
      const token = parsed.data.turnstileToken;
      if (!token)
        return c.json(
          {
            error: {
              code: "challenge_required",
              message: "Verify that you are human to start your guest session.",
            },
          },
          403,
        );
      const ip = c.req.header("CF-Connecting-IP") ?? "";
      const attempts = await networkWindow(
        policy.networkSecret,
        ip,
        now,
        "guest-attempt",
        600,
      );
      if (!(await takeAttempt(policy.db, attempts, 10))) {
        c.header("Retry-After", String(attempts.expiresAt - now));
        return c.json(
          {
            error: {
              code: "rate_limited",
              message:
                "Too many verification attempts from this network. Try again later.",
            },
          },
          429,
        );
      }
      const issued = await networkWindow(
        policy.networkSecret,
        ip,
        now,
        "guest-issued",
      );
      await ensureWindow(policy.db, issued, policy.limits.sessions);
      const capacity = await policy.db
        .prepare("SELECT id FROM network_windows WHERE id = ? AND used < cap")
        .bind(issued.id)
        .first();
      if (!capacity) {
        c.header("Retry-After", String(issued.expiresAt - now));
        return c.json(
          {
            error: {
              code: "rate_limited",
              message:
                "This network has reached its guest creation limit for today. Existing sessions can still be used.",
            },
          },
          429,
        );
      }
      const tokenDigest = await digestSessionToken(token);
      if (
        await policy.db
          .prepare(
            "SELECT token_digest FROM turnstile_redemptions WHERE token_digest = ?",
          )
          .bind(tokenDigest)
          .first()
      )
        return c.json(
          {
            error: {
              code: "challenge_failed",
              message: "Verification was already used. Please verify again.",
            },
          },
          403,
        );
      if (
        !(await verifyTurnstile(policy.secret, token, policy.hostname, ip, now))
      )
        return c.json(
          {
            error: {
              code: "challenge_failed",
              message: "Verification expired or failed. Please verify again.",
            },
          },
          403,
        );
      publicContext = { tokenDigest, networkWindow: issued.id };
    }
    let result;
    try {
      result = await getOrCreateGuest(
        policy.db,
        cookie,
        policy.allowanceVideos,
        now,
        publicContext,
      );
    } catch (error) {
      // A second request can redeem a token or fill the network bucket while verification is in flight.
      if (publicContext) {
        if (
          await policy.db
            .prepare(
              "SELECT token_digest FROM turnstile_redemptions WHERE token_digest = ?",
            )
            .bind(publicContext.tokenDigest)
            .first()
        )
          return c.json(
            {
              error: {
                code: "challenge_failed",
                message: "Verification was already used. Please verify again.",
              },
            },
            403,
          );
        if (
          await policy.db
            .prepare(
              "SELECT id FROM network_windows WHERE id = ? AND used >= cap",
            )
            .bind(publicContext.networkWindow)
            .first()
        )
          return c.json(
            {
              error: {
                code: "rate_limited",
                message:
                  "This network has reached its guest creation limit. Try again later.",
              },
            },
            429,
          );
      }
      throw error;
    }
    if (result.newToken)
      setCookie(c, policy.cookie, result.newToken, {
        httpOnly: true,
        sameSite: "Strict",
        path: "/",
        maxAge: SESSION_LIFETIME_SECONDS,
        secure: new URL(c.req.url).protocol === "https:",
      });
    return c.json(result.usage, result.newToken ? 201 : 200);
  },
);
guestRoutes.get("/usage", async (c) => {
  const policy = getGuestPolicy(c.env, c.req.url)!;
  const now = Math.floor(Date.now() / 1000);
  const cookie = getCookie(c, policy.cookie);
  const usage = await readGuestUsage(policy.db, cookie, now, policy.mode);
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
  await expireJobs(policy.db, usage.guest.id, now);
  return c.json(await readGuestUsage(policy.db, cookie, now, policy.mode));
});
