export type AuthFormErrorCode =
  | "email_already_registered"
  | "email_already_verified"
  | "email_not_verified"
  | "email_verification_disabled"
  | "invalid_credentials"
  | "invalid_form"
  | "invalid_callback_url"
  | "invalid_reset_token"
  | "network_error"
  | "rate_limited"
  | "unknown_error"
  | "user_banned";

export type AuthFormState =
  | Readonly<{
      status: "idle";
    }>
  | Readonly<{
      status: "error";
      error: AuthFormErrorCode;
    }>;

export const initialAuthFormState: AuthFormState = { status: "idle" };
