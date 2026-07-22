"use server";

import { redirect } from "next/navigation";

import { mapAuthError } from "@/features/auth/error-map";
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from "@/features/auth/schemas";
import type { AuthFormState } from "@/features/auth/types";
import { defaultLocale, isLocale } from "@/i18n/routing";
import { auth } from "@/server/auth/server";
import {
  ensureAppUser,
  getOrProvisionAppUser,
  isUserBanned,
  recordEmailVerificationRequired,
} from "@/server/services/users";

export async function signInAction(
  _previousState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsedInput = loginSchema.safeParse({
    email: formData.get("email"),
    locale: formData.get("locale"),
    password: formData.get("password"),
  });

  if (!parsedInput.success) {
    return errorState("invalid_form");
  }

  const { email, locale, password } = parsedInput.data;
  let destination = `/${locale}/home`;

  try {
    const { data, error } = await auth.signIn.email({ email, password });

    if (error) {
      const errorCode = mapAuthError(error);

      if (errorCode === "email_not_verified") {
        destination = `/${locale}/verify-email`;
      } else {
        return errorState(errorCode);
      }
    } else if (data?.user) {
      const appUser = await getOrProvisionAppUser({
        authUser: {
          emailVerified: data.user.emailVerified,
          id: data.user.id,
          image: data.user.image,
          name: data.user.name,
        },
        locale,
        provider: "email",
        provisioningSource: "sign_in",
      });

      if (isUserBanned(appUser.profile)) {
        await auth.signOut();
        return errorState("user_banned");
      }

      if (!appUser.emailVerified) {
        destination = `/${locale}/verify-email`;
      }
    } else {
      return errorState("unknown_error");
    }
  } catch (error) {
    return errorState(mapAuthError(error));
  }

  redirect(destination);
}

export async function signUpAction(
  _previousState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsedInput = registerSchema.safeParse({
    confirmPassword: formData.get("confirmPassword"),
    email: formData.get("email"),
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    locale: formData.get("locale"),
    password: formData.get("password"),
  });

  if (!parsedInput.success) {
    return errorState("invalid_form");
  }

  const { email, firstName, lastName, locale, password } = parsedInput.data;
  const displayName = `${firstName} ${lastName}`;

  try {
    const { data, error } = await auth.signUp.email({
      callbackURL: `/${locale}/verify-email/result`,
      email,
      name: displayName,
      password,
    });

    if (error) {
      return errorState(mapAuthError(error));
    }

    if (!data?.user) {
      return errorState("unknown_error");
    }

    await ensureAppUser({
      authUser: {
        emailVerified: data.user.emailVerified,
        id: data.user.id,
        image: data.user.image,
        name: data.user.name,
      },
      locale,
      provider: "email",
      registrationProfile: {
        firstName,
        lastName,
      },
    });

    if (!data.user.emailVerified) {
      await recordEmailVerificationRequired(data.user.id);
    }
  } catch (error) {
    return errorState(mapAuthError(error));
  }

  redirect(`/${locale}/verify-email`);
}

export async function requestPasswordResetAction(
  _previousState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsedInput = forgotPasswordSchema.safeParse({
    email: formData.get("email"),
    locale: formData.get("locale"),
  });

  if (!parsedInput.success) {
    return errorState("invalid_form");
  }

  const { email, locale } = parsedInput.data;

  try {
    const { error } = await auth.requestPasswordReset({
      email,
      redirectTo: `/${locale}/reset-password`,
    });

    if (error) {
      return errorState(mapAuthError(error));
    }
  } catch (error) {
    return errorState(mapAuthError(error));
  }

  redirect(`/${locale}/forgot-password/sent`);
}

export async function resetPasswordAction(
  _previousState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsedInput = resetPasswordSchema.safeParse({
    confirmPassword: formData.get("confirmPassword"),
    locale: formData.get("locale"),
    password: formData.get("password"),
    token: formData.get("token"),
  });

  if (!parsedInput.success) {
    return errorState("invalid_form");
  }

  const { locale, password, token } = parsedInput.data;

  try {
    const { error } = await auth.resetPassword({
      newPassword: password,
      token,
    });

    if (error) {
      return errorState(mapAuthError(error));
    }
  } catch (error) {
    return errorState(mapAuthError(error));
  }

  redirect(`/${locale}/reset-password/success`);
}

export async function signOutAction(formData: FormData): Promise<void> {
  const localeValue = formData.get("locale");
  const locale =
    typeof localeValue === "string" && isLocale(localeValue)
      ? localeValue
      : defaultLocale;

  await auth.signOut();
  redirect(`/${locale}/login`);
}

function errorState(
  error: Exclude<AuthFormState, { status: "idle" }>["error"],
): AuthFormState {
  return { status: "error", error };
}
