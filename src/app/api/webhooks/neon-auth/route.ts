import { Buffer } from "node:buffer";

import {
  neonMagicLinkWebhookSchema,
  NeonWebhookInfrastructureError,
  NeonWebhookVerificationError,
  verifyNeonWebhook,
} from "@/server/auth/neon-webhook";
import {
  AuthEmailConfigurationError,
  AuthEmailDeliveryError,
  sendAuthEmail,
} from "@/server/email/resend";
import {
  AuthEmailTemplateError,
  renderAuthEmail,
  type SupportedAuthEmailType,
} from "@/server/email/render-auth-email";

export const runtime = "nodejs";

const MAX_BODY_BYTES = 64 * 1024;

export async function POST(request: Request): Promise<Response> {
  if (!request.headers.get("content-type")?.includes("application/json")) {
    return jsonError("unsupported_media_type", 415);
  }

  const declaredContentLength = Number(request.headers.get("content-length"));

  if (
    Number.isFinite(declaredContentLength) &&
    declaredContentLength > MAX_BODY_BYTES
  ) {
    return jsonError("payload_too_large", 413);
  }

  const rawBody = await request.text();

  if (Buffer.byteLength(rawBody, "utf8") > MAX_BODY_BYTES) {
    return jsonError("payload_too_large", 413);
  }

  try {
    const verifiedHeaders = await verifyNeonWebhook(rawBody, request.headers);
    const parsedPayload = neonMagicLinkWebhookSchema.safeParse(
      JSON.parse(rawBody) as unknown,
    );

    if (!parsedPayload.success) {
      return jsonError("invalid_payload", 400);
    }

    const payload = parsedPayload.data;

    if (
      verifiedHeaders.eventId !== payload.event_id ||
      verifiedHeaders.eventType !== payload.event_type
    ) {
      return jsonError("header_payload_mismatch", 400);
    }

    if (!isSupportedEmailType(payload.event_data.link_type)) {
      return jsonError("unsupported_link_type", 422);
    }

    const email = await renderAuthEmail(
      payload.event_data.link_type,
      payload.event_data.link_url,
    );

    await sendAuthEmail({
      eventId: payload.event_id,
      html: email.html,
      subject: email.subject,
      to: payload.user.email,
    });

    return Response.json({ success: true });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return jsonError("invalid_json", 400);
    }

    if (error instanceof NeonWebhookVerificationError) {
      console.warn("Rejected Neon Auth webhook", {
        reason: error.message,
      });
      return jsonError("invalid_signature", 401);
    }

    if (error instanceof NeonWebhookInfrastructureError) {
      console.error(
        "Neon Auth webhook verification is temporarily unavailable",
        {
          reason: error.message,
        },
      );
      return jsonError("verification_service_unavailable", 503);
    }

    if (error instanceof AuthEmailDeliveryError) {
      console.error("Resend rejected a Neon Auth email", {
        code: error.code,
        statusCode: error.statusCode,
      });
      return jsonError(
        "email_delivery_failed",
        error.isRetryable() ? 503 : 422,
      );
    }

    if (
      error instanceof AuthEmailConfigurationError ||
      error instanceof AuthEmailTemplateError
    ) {
      console.error("Auth email webhook is not configured correctly", {
        reason: error.message,
      });
      return jsonError("email_service_unavailable", 503);
    }

    console.error("Unexpected Neon Auth webhook error");
    return jsonError("internal_error", 500);
  }
}

function isSupportedEmailType(value: string): value is SupportedAuthEmailType {
  return value === "email-verification" || value === "forget-password";
}

function jsonError(error: string, status: number): Response {
  return Response.json({ error }, { status });
}
