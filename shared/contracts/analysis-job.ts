import { z } from "zod";

export const analysisProvenanceSchema = z
  .object({
    promptId: z.literal("highlights"),
    promptVersion: z
      .string()
      .regex(/^v\d+$/)
      .max(16),
    schemaVersion: z.literal("highlights-result@1"),
    repairVersion: z
      .string()
      .regex(/^v\d+$/)
      .max(16),
    speechModel: z.string().max(180),
    soundModel: z.string().max(180).nullable(),
    rankingModel: z.string().max(180),
  })
  .strict();
export const analysisTimingsSchema = z
  .object(
    Object.fromEntries(
      [
        "speechLoad",
        "transcription",
        "soundLoad",
        "soundScan",
        "rankerLoad",
        "ranking",
        "total",
      ].map((key) => [
        key,
        z.number().finite().min(0).max(604800000).optional(),
      ]),
    ),
  )
  .strict();
export type AnalysisProvenance = z.infer<typeof analysisProvenanceSchema>;
export type AnalysisReport = {
  jobId: string;
  provenance: AnalysisProvenance;
  timings: Record<string, number>;
};

export const reserveAnalysisSchema = z
  .object({
    id: z.string().uuid(),
    sourceId: z.string().uuid(),
    fileBytes: z.number().int().positive().max(2_000_000_000),
    provenance: analysisProvenanceSchema.optional(),
  })
  .strict();
export const analysisJobSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["reserved", "completed", "cancelled", "expired"]),
});
export type AnalysisJob = z.infer<typeof analysisJobSchema>;
export const analysisOperationSchema = z
  .object({ id: z.string().uuid() })
  .strict();
export const completeAnalysisSchema = analysisOperationSchema.extend({
  timings: analysisTimingsSchema.optional(),
});
