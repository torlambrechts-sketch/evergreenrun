import { z } from "zod";

/** Experience levels. 'regular'/'experienced' get the Foundation program; the
 *  rest get the walk-run on-ramp (see lib/db/plan.ts FOUNDATION_LEVELS). */
export const EXPERIENCE_LEVELS = ["returning", "regular", "experienced"] as const;
export const AGE_BANDS = ["35-44", "45-54", "55-64", "65+"] as const;

export const ProfileSchema = z.object({
  displayName: z
    .string()
    .trim()
    .max(60)
    .optional()
    .transform((v) => (v === "" ? undefined : v)),
  ageBand: z
    .union([z.enum(AGE_BANDS), z.literal("")])
    .transform((v) => (v === "" ? undefined : v))
    .optional(),
  experienceLevel: z
    .union([z.enum(EXPERIENCE_LEVELS), z.literal("")])
    .transform((v) => (v === "" ? undefined : v))
    .optional(),
});

export type ProfileInput = z.infer<typeof ProfileSchema>;
