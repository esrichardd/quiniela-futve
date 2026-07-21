import { z } from "zod";

import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
} from "@/features/auth/password-policy";
import { locales } from "@/i18n/routing";

const emailSchema = z.string().trim().toLowerCase().email();
const localeSchema = z.enum(locales);
const nameSchema = z.string().trim().min(1).max(80);
const passwordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH)
  .max(PASSWORD_MAX_LENGTH)
  .regex(/[A-Z]/)
  .regex(/[0-9]/);

export const loginSchema = z.object({
  email: emailSchema,
  locale: localeSchema,
  password: z.string().min(1).max(128),
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
  locale: localeSchema,
});

export const registerSchema = z
  .object({
    confirmPassword: z.string(),
    email: emailSchema,
    firstName: nameSchema,
    lastName: nameSchema,
    locale: localeSchema,
    password: passwordSchema,
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
  });

export const resetPasswordSchema = z
  .object({
    confirmPassword: z.string(),
    locale: localeSchema,
    password: passwordSchema,
    token: z.string().min(1),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
  });
