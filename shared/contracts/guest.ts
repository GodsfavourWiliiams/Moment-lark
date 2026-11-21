import { z } from "zod";

export const guestSessionRequestSchema = z.object({}).strict();

export const guestUsageSchema = z.object({
  guest: z.object({
    id: z.string().uuid(),
    expiresAt: z.string().datetime(),
  }),
  allowance: z.object({
    grantedSeconds: z.number().int().nonnegative(),
    usedSeconds: z.number().int().nonnegative(),
    reservedSeconds: z.number().int().nonnegative(),
    remainingSeconds: z.number().int().nonnegative(),
  }),
  mode: z.literal("local-development"),
});

export const guestErrorSchema = z.object({
  error: z.object({ code: z.string(), message: z.string() }),
});

export type GuestUsage = z.infer<typeof guestUsageSchema>;
