import { z } from "zod";

import { EXPERIENCE_LEVELS } from "@/lib/validation/profile";

export const LoginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
  next: z.string().startsWith("/").optional(),
});

export const SignupSchema = z.object({
  firstName: z.string().trim().min(1, "Tell us your first name.").max(60),
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  password: z.string().min(8, "Use at least 8 characters."),
  experienceLevel: z
    .union([z.enum(EXPERIENCE_LEVELS), z.literal("")])
    .transform((v) => (v === "" ? undefined : v))
    .optional(),
  next: z.string().startsWith("/").optional(),
});

export type LoginInput = z.infer<typeof LoginSchema>;
export type SignupInput = z.infer<typeof SignupSchema>;
