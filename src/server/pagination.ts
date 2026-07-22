import "server-only";

const CURSOR_VERSION = 1;
const MAX_CURSOR_LENGTH = 256;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TIMESTAMP_PATTERN =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{6}Z$/;

export type PaginationCursor = Readonly<{
  createdAt: string;
  id: string;
}>;

export class InvalidPaginationCursorError extends Error {
  constructor() {
    super("Pagination cursor is invalid.");
    this.name = "InvalidPaginationCursorError";
  }
}

export function encodePaginationCursor(cursor: PaginationCursor): string {
  return Buffer.from(
    JSON.stringify([CURSOR_VERSION, cursor.createdAt, cursor.id]),
  ).toString("base64url");
}

export function decodePaginationCursor(
  value: string | undefined,
): PaginationCursor | null {
  if (!value) {
    return null;
  }

  if (value.length > MAX_CURSOR_LENGTH) {
    throw new InvalidPaginationCursorError();
  }

  try {
    const payload: unknown = JSON.parse(
      Buffer.from(value, "base64url").toString("utf8"),
    );

    if (
      !Array.isArray(payload) ||
      payload.length !== 3 ||
      payload[0] !== CURSOR_VERSION ||
      typeof payload[1] !== "string" ||
      typeof payload[2] !== "string" ||
      !TIMESTAMP_PATTERN.test(payload[1]) ||
      !UUID_PATTERN.test(payload[2])
    ) {
      throw new InvalidPaginationCursorError();
    }

    if (Number.isNaN(Date.parse(payload[1]))) {
      throw new InvalidPaginationCursorError();
    }

    return { createdAt: payload[1], id: payload[2] };
  } catch (error) {
    if (error instanceof InvalidPaginationCursorError) {
      throw error;
    }

    throw new InvalidPaginationCursorError();
  }
}
