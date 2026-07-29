import "server-only";

import type { AuthFormErrorCode } from "@/features/auth/types";

type ErrorDetails = Readonly<{
  code?: string;
  message?: string;
  status?: number;
}>;

export function mapAuthError(error: unknown): AuthFormErrorCode {
  const details = getErrorDetails(error);
  const code = details.code?.toLowerCase();
  const signal = `${details.code ?? ""} ${details.message ?? ""}`.toUpperCase();

  if (
    details.status === 429 ||
    code === "over_email_send_rate_limit" ||
    code === "over_request_rate_limit" ||
    signal.includes("TOO_MANY_REQUESTS")
  ) {
    return "rate_limited";
  }

  if (
    code === "email_not_confirmed" ||
    signal.includes("EMAIL_NOT_VERIFIED") ||
    signal.includes("EMAIL NOT VERIFIED") ||
    signal.includes("EMAIL VERIFICATION REQUIRED")
  ) {
    return "email_not_verified";
  }

  if (
    code === "email_exists" ||
    code === "user_already_exists" ||
    signal.includes("USER_ALREADY_EXISTS") ||
    signal.includes("USER ALREADY EXISTS") ||
    signal.includes("ALREADY REGISTERED")
  ) {
    return "email_already_registered";
  }

  if (
    code === "email_already_verified" ||
    signal.includes("EMAIL_ALREADY_VERIFIED") ||
    signal.includes("EMAIL ALREADY VERIFIED")
  ) {
    return "email_already_verified";
  }

  if (
    code === "verification_email_not_enabled" ||
    signal.includes("VERIFICATION_EMAIL_NOT_ENABLED") ||
    signal.includes("VERIFICATION EMAIL ISN'T ENABLED")
  ) {
    return "email_verification_disabled";
  }

  if (
    code === "invalid_callback_url" ||
    signal.includes("INVALID_CALLBACK_URL") ||
    signal.includes("INVALID CALLBACKURL")
  ) {
    return "invalid_callback_url";
  }

  if (
    code === "identity_not_found" ||
    code === "invalid_credentials" ||
    code === "user_not_found" ||
    signal.includes("INVALID_EMAIL_OR_PASSWORD") ||
    signal.includes("INVALID EMAIL OR PASSWORD") ||
    signal.includes("INVALID_PASSWORD") ||
    signal.includes("INVALID PASSWORD") ||
    signal.includes("CREDENTIAL_ACCOUNT_NOT_FOUND") ||
    signal.includes("CREDENTIAL ACCOUNT NOT FOUND")
  ) {
    return "invalid_credentials";
  }

  if (
    code === "bad_jwt" ||
    signal.includes("INVALID_TOKEN") ||
    signal.includes("INVALID TOKEN") ||
    signal.includes("TOKEN_EXPIRED") ||
    signal.includes("TOKEN EXPIRED")
  ) {
    return "invalid_reset_token";
  }

  if (
    code === "validation_failed" ||
    code === "validation_error" ||
    code === "weak_password" ||
    signal.includes("PASSWORD_TOO_SHORT") ||
    signal.includes("PASSWORD TOO SHORT") ||
    signal.includes("PASSWORD_TOO_LONG") ||
    signal.includes("PASSWORD TOO LONG")
  ) {
    return "invalid_form";
  }

  if (
    signal.includes("NETWORK_") ||
    signal.includes("FETCH FAILED") ||
    signal.includes("ECONN")
  ) {
    return "network_error";
  }

  return "unknown_error";
}

function getErrorDetails(error: unknown): ErrorDetails {
  if (!error || typeof error !== "object") {
    return {};
  }

  const candidate = error as Record<string, unknown>;

  return {
    code: typeof candidate.code === "string" ? candidate.code : undefined,
    message:
      typeof candidate.message === "string" ? candidate.message : undefined,
    status: typeof candidate.status === "number" ? candidate.status : undefined,
  };
}
