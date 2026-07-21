import "server-only";

import { Buffer } from "node:buffer";
import type { JsonWebKey } from "node:crypto";
import { createPublicKey, verify } from "node:crypto";

import { z } from "zod";

import { env } from "@/lib/env";

const MAX_TIMESTAMP_AGE_MS = 5 * 60 * 1000;
const JWKS_CACHE_TTL_MS = 5 * 60 * 1000;
const JWKS_MIN_REFRESH_INTERVAL_MS = 30 * 1000;

const webhookHeadersSchema = z.object({
  eventId: z.string().min(1).max(256),
  eventType: z.string().min(1).max(100),
  kid: z.string().min(1).max(256),
  signature: z.string().min(1).max(2048),
  timestamp: z.string().regex(/^\d+$/),
});

const signatureHeaderSchema = z.object({
  alg: z.literal("EdDSA"),
  kid: z.string().min(1).max(256),
});

const jwkSchema = z
  .object({
    alg: z.literal("EdDSA").optional(),
    crv: z.literal("Ed25519"),
    kid: z.string().min(1).max(256),
    kty: z.literal("OKP"),
    use: z.string().optional(),
    x: z.string().min(1),
  })
  .passthrough();

const jwksSchema = z.object({
  keys: z.array(jwkSchema),
});

export const neonMagicLinkWebhookSchema = z.object({
  context: z
    .object({
      endpoint_id: z.string().optional(),
      project_name: z.string().optional(),
    })
    .passthrough(),
  event_data: z
    .object({
      expires_at: z.string().datetime(),
      ip_address: z.string().optional(),
      link_type: z.enum(["email-verification", "forget-password", "sign-in"]),
      link_url: z.string().url().max(8192),
      token: z.string().min(1),
      user_agent: z.string().optional(),
    })
    .passthrough(),
  event_id: z.string().min(1).max(256),
  event_type: z.literal("send.magic_link"),
  timestamp: z.string().datetime(),
  user: z
    .object({
      email: z.string().email(),
    })
    .passthrough(),
});

export type NeonMagicLinkWebhook = z.infer<typeof neonMagicLinkWebhookSchema>;

type CachedJwks = Readonly<{
  expiresAt: number;
  keys: ReadonlyArray<z.infer<typeof jwkSchema>>;
}>;

let cachedJwks: CachedJwks | null = null;
let jwksRequest: Promise<CachedJwks> | null = null;
let lastJwksFetchAt = 0;

export async function verifyNeonWebhook(
  rawBody: string,
  headers: Headers,
): Promise<Readonly<{ eventId: string; eventType: string }>> {
  const parsedHeaders = webhookHeadersSchema.safeParse({
    eventId: headers.get("x-neon-event-id"),
    eventType: headers.get("x-neon-event-type"),
    kid: headers.get("x-neon-signature-kid"),
    signature: headers.get("x-neon-signature"),
    timestamp: headers.get("x-neon-timestamp"),
  });

  if (!parsedHeaders.success) {
    throw new NeonWebhookVerificationError("Missing or invalid webhook headers");
  }

  const { eventId, eventType, kid, signature, timestamp } = parsedHeaders.data;
  const timestampNumber = Number(timestamp);

  if (
    !Number.isSafeInteger(timestampNumber) ||
    Math.abs(Date.now() - timestampNumber) > MAX_TIMESTAMP_AGE_MS
  ) {
    throw new NeonWebhookVerificationError("Webhook timestamp is stale");
  }

  const signatureParts = signature.split(".");

  if (signatureParts.length !== 3 || signatureParts[1] !== "") {
    throw new NeonWebhookVerificationError("Invalid detached JWS format");
  }

  const [headerBase64, , signatureBase64] = signatureParts;
  const parsedSignatureHeader = parseSignatureHeader(headerBase64);

  if (parsedSignatureHeader.kid !== kid) {
    throw new NeonWebhookVerificationError("Webhook key identifiers do not match");
  }

  const jwk = await findJwk(kid);
  let publicKey: ReturnType<typeof createPublicKey>;

  try {
    publicKey = createPublicKey({
      format: "jwk",
      key: jwk as JsonWebKey,
    });
  } catch {
    throw new NeonWebhookInfrastructureError(
      "Neon webhook signing key could not be loaded",
    );
  }

  const payloadBase64 = Buffer.from(rawBody, "utf8").toString("base64url");
  const timestampedPayload = `${timestamp}.${payloadBase64}`;
  const encodedTimestampedPayload = Buffer.from(
    timestampedPayload,
    "utf8",
  ).toString("base64url");
  const signingInput = `${headerBase64}.${encodedTimestampedPayload}`;
  const isValid = verify(
    null,
    Buffer.from(signingInput, "utf8"),
    publicKey,
    Buffer.from(signatureBase64, "base64url"),
  );

  if (!isValid) {
    throw new NeonWebhookVerificationError("Invalid webhook signature");
  }

  return { eventId, eventType };
}

export class NeonWebhookVerificationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NeonWebhookVerificationError";
  }
}

export class NeonWebhookInfrastructureError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NeonWebhookInfrastructureError";
  }
}

function parseSignatureHeader(
  headerBase64: string,
): z.infer<typeof signatureHeaderSchema> {
  try {
    const decodedHeader: unknown = JSON.parse(
      Buffer.from(headerBase64, "base64url").toString("utf8"),
    );
    const parsedHeader = signatureHeaderSchema.safeParse(decodedHeader);

    if (!parsedHeader.success) {
      throw new NeonWebhookVerificationError("Invalid JWS header");
    }

    return parsedHeader.data;
  } catch (error) {
    if (error instanceof NeonWebhookVerificationError) {
      throw error;
    }

    throw new NeonWebhookVerificationError("Invalid JWS header encoding");
  }
}

async function findJwk(kid: string): Promise<z.infer<typeof jwkSchema>> {
  const cachedKey = getCachedJwk(kid);

  if (cachedKey) {
    return cachedKey;
  }

  const freshJwks = await fetchJwks();
  const key = freshJwks.keys.find((candidate) => candidate.kid === kid);

  if (!key) {
    throw new NeonWebhookVerificationError("Webhook signing key was not found");
  }

  return key;
}

function getCachedJwk(kid: string): z.infer<typeof jwkSchema> | undefined {
  if (!cachedJwks || cachedJwks.expiresAt <= Date.now()) {
    cachedJwks = null;
    return undefined;
  }

  return cachedJwks.keys.find((candidate) => candidate.kid === kid);
}

async function fetchJwks(): Promise<CachedJwks> {
  if (jwksRequest) {
    return jwksRequest;
  }

  const now = Date.now();

  if (now - lastJwksFetchAt < JWKS_MIN_REFRESH_INTERVAL_MS) {
    throw new NeonWebhookInfrastructureError(
      "Webhook signing key refresh was rate limited",
    );
  }

  lastJwksFetchAt = now;
  jwksRequest = requestJwks();

  try {
    return await jwksRequest;
  } finally {
    jwksRequest = null;
  }
}

async function requestJwks(): Promise<CachedJwks> {
  const jwksUrl = `${env.NEON_AUTH_BASE_URL.replace(/\/$/, "")}/.well-known/jwks.json`;
  let response: Response;

  try {
    response = await fetch(jwksUrl, { cache: "no-store" });
  } catch {
    throw new NeonWebhookInfrastructureError("Could not fetch Neon JWKS");
  }

  if (!response.ok) {
    throw new NeonWebhookInfrastructureError("Could not fetch Neon JWKS");
  }

  let jwksPayload: unknown;

  try {
    jwksPayload = await response.json();
  } catch {
    throw new NeonWebhookInfrastructureError("Neon JWKS response is invalid");
  }

  const parsedJwks = jwksSchema.safeParse(jwksPayload);

  if (!parsedJwks.success) {
    throw new NeonWebhookInfrastructureError("Neon JWKS response is invalid");
  }

  cachedJwks = {
    expiresAt: Date.now() + JWKS_CACHE_TTL_MS,
    keys: parsedJwks.data.keys,
  };

  return cachedJwks;
}
