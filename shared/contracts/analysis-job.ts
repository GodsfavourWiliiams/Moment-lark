import { z } from "zod";

export const reserveAnalysisSchema = z
  .object({
    id: z.string().uuid(),
    sourceId: z.string().uuid(),
    fileBytes: z.number().int().positive().max(2_000_000_000),
  })
  .strict();
export const analysisJobSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["reserved", "completed", "cancelled", "expired"]),
});
export type AnalysisJob = z.infer<typeof analysisJobSchema>;
