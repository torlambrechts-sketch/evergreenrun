import { z } from "zod";

/** Talk-test options mirror the run_activity CHECK constraint. */
export const TALK_TEST_VALUES = [
  "full_sentences",
  "phrases",
  "single_words",
] as const;

/**
 * Boundary schema for the "log a run" form. Kept small (≤30-second form):
 * distance + duration are required; pace is derived, HR/RPE/talk-test optional.
 * Empty optional fields arrive as "" from HTML forms and coerce to undefined.
 */
const optionalNumber = z
  .union([z.string(), z.number()])
  .transform((v) => (v === "" || v === null || v === undefined ? undefined : Number(v)))
  .pipe(z.number().optional());

export const LogRunSchema = z.object({
  // Calendar day of the run (YYYY-MM-DD).
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a date.")
    .refine((d) => !Number.isNaN(Date.parse(d)), "Pick a valid date."),
  distanceKm: z.coerce
    .number()
    .positive("Distance must be greater than zero.")
    .max(500, "That distance looks too large."),
  durationMin: z.coerce
    .number()
    .positive("Duration must be greater than zero.")
    .max(1440, "That duration looks too long."),
  rpe: optionalNumber.pipe(
    z.number().int().min(1).max(10).optional(),
  ),
  talkTest: z
    .union([z.enum(TALK_TEST_VALUES), z.literal("")])
    .transform((v) => (v === "" ? undefined : v))
    .optional(),
  avgHr: optionalNumber.pipe(
    z.number().int().min(30).max(250).optional(),
  ),
});

export type LogRunInput = z.infer<typeof LogRunSchema>;
