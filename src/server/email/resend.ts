import "server-only";

import type { ErrorResponse } from "resend";
import { Resend } from "resend";

import { env } from "@/lib/env";

type SendAuthEmailInput = Readonly<{
  eventId: string;
  html: string;
  subject: string;
  to: string;
}>;

let resendClient: Resend | null = null;

export async function sendAuthEmail({
  eventId,
  html,
  subject,
  to,
}: SendAuthEmailInput): Promise<string> {
  const resend = getResendClient();

  try {
    const { data, error } = await resend.emails.send(
      {
        from: env.AUTH_EMAIL_FROM,
        html,
        subject,
        to,
      },
      {
        idempotencyKey: `neon-auth/${eventId}`,
      },
    );

    if (error) {
      throw AuthEmailDeliveryError.fromResend(error);
    }

    return data.id;
  } catch (error) {
    if (
      error instanceof AuthEmailConfigurationError ||
      error instanceof AuthEmailDeliveryError
    ) {
      throw error;
    }

    throw new AuthEmailDeliveryError({
      code: "network_error",
      message: "Resend could not accept the auth email",
      statusCode: null,
    });
  }
}

export class AuthEmailConfigurationError extends Error {
  constructor() {
    super("RESEND_API_KEY is not configured");
    this.name = "AuthEmailConfigurationError";
  }
}

export class AuthEmailDeliveryError extends Error {
  readonly code: string;
  readonly statusCode: number | null;

  constructor({
    code,
    message,
    statusCode,
  }: Readonly<{
    code: string;
    message: string;
    statusCode: number | null;
  }>) {
    super(message);
    this.name = "AuthEmailDeliveryError";
    this.code = code;
    this.statusCode = statusCode;
  }

  static fromResend(error: ErrorResponse): AuthEmailDeliveryError {
    return new AuthEmailDeliveryError({
      code: error.name,
      message: error.message,
      statusCode: error.statusCode,
    });
  }

  isRetryable(): boolean {
    if (this.statusCode === null || this.statusCode >= 500) {
      return true;
    }

    return [408, 409, 429].includes(this.statusCode);
  }
}

function getResendClient(): Resend {
  if (!env.RESEND_API_KEY) {
    throw new AuthEmailConfigurationError();
  }

  resendClient ??= new Resend(env.RESEND_API_KEY);

  return resendClient;
}
