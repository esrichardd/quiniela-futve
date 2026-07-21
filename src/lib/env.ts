import "server-only";

import { z } from "zod";

const envSchema = z.object({
  AUTH_EMAIL_FROM: z
    .string()
    .min(1, "AUTH_EMAIL_FROM is required")
    .default("Quiniela FUTVE <onboarding@resend.dev>"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  NEON_AUTH_BASE_URL: z.string().url("NEON_AUTH_BASE_URL must be a URL"),
  NEON_AUTH_COOKIE_SECRET: z
    .string()
    .min(32, "NEON_AUTH_COOKIE_SECRET must be at least 32 characters"),
  RESEND_API_KEY: z.string().min(1, "RESEND_API_KEY cannot be empty").optional(),
});

export const env = envSchema.parse({
  AUTH_EMAIL_FROM: process.env.AUTH_EMAIL_FROM,
  DATABASE_URL: process.env.DATABASE_URL,
  NEON_AUTH_BASE_URL: process.env.NEON_AUTH_BASE_URL,
  NEON_AUTH_COOKIE_SECRET: process.env.NEON_AUTH_COOKIE_SECRET,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
});
