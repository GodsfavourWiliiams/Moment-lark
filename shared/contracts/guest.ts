import { z } from "zod";

export const guestSessionRequestSchema = z
  .object({ turnstileToken: z.string().min(1).max(2048).optional() })
  .strict();

export const guestUsageSchema = z.object({
  guest: z.object({
    id: z.string().uuid(),
    expiresAt: z.string().datetime(),
  }),
  allowance: z.object({
    grantedVideos: z.number().int().nonnegative(),
    usedVideos: z.number().int().nonnegative(),
    reservedVideos: z.number().int().nonnegative(),
    remainingVideos: z.number().int().nonnegative(),
  }),
  mode: z.enum(["local-development", "public"]),
});

export const guestErrorSchema = z.object({
  error: z.object({ code: z.string(), message: z.string() }),
});

export type GuestUsage = z.infer<typeof guestUsageSchema>;

export const guestChallengeSchema = z.object({
  siteKey: z.string().min(1).max(100),
  action: z.literal("guest_session"),
});
