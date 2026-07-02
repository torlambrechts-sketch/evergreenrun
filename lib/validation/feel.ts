import { z } from "zod";

const optionalRating = z
  .union([z.string(), z.number()])
  .transform((v) => (v === "" || v === null || v === undefined ? undefined : Number(v)))
  .pipe(z.number().int().min(0).max(10).optional());

/** Boundary schema for the feel-log form. Red-flag checkboxes are parsed in the action. */
export const FeelLogSchema = z.object({
  soreness: optionalRating,
  painArea: z
    .string()
    .trim()
    .max(120)
    .optional()
    .transform((v) => (v === "" ? undefined : v)),
  painIntensity: optionalRating,
  morningStiffness: optionalRating,
  fatigue: optionalRating,
  confidence: optionalRating,
  settling: z.enum(["yes", "no", "unknown"]).optional(),
});

export type FeelLogInput = z.infer<typeof FeelLogSchema>;
