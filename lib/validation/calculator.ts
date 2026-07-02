import { z } from "zod";

const rating = z.coerce.number().int().min(0).max(10);

/**
 * Public calculator quiz — 10 self-report inputs, no account needed. These map
 * directly to the engine's DurabilityInput; the scoring itself is the same
 * deterministic engine used for signed-in users.
 */
export const CalculatorSchema = z.object({
  runsThisWeek: z.coerce.number().int().min(0).max(21),
  minutesThisWeek: z.coerce.number().min(0).max(3000), // acute load proxy
  typicalMinutesPerWeek: z.coerce.number().min(0).max(3000), // chronic load proxy
  weeksActive: z.coerce.number().int().min(0).max(4), // of the last 4 weeks
  strengthDays: z.coerce.number().int().min(0).max(7),
  soreness: rating,
  pain: rating,
  morningStiffness: rating,
  fatigue: rating,
  confidence: rating,
});
export type CalculatorInput = z.infer<typeof CalculatorSchema>;

/** Email capture after the score is shown. */
export const LeadCaptureSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  score: z.coerce.number().int().min(0).max(100),
});
export type LeadCaptureInput = z.infer<typeof LeadCaptureSchema>;
