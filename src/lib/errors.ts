/**
 * Error handling boundary.
 *
 * Only `AppError` messages are safe to show a client. Everything else -- most
 * importantly PostgREST/Postgres errors, which carry table, column and
 * constraint names -- is logged server-side and replaced with a generic
 * fallback before it reaches the browser.
 */

export class AppError extends Error {
  readonly status: number;
  readonly fieldErrors?: Record<string, string>;

  constructor(
    message: string,
    options?: { status?: number; fieldErrors?: Record<string, string> },
  ) {
    super(message);
    this.name = "AppError";
    this.status = options?.status ?? 400;
    this.fieldErrors = options?.fieldErrors;
  }
}

/** Thrown when a caller asks for something that is not theirs. */
export class NotFoundError extends AppError {
  constructor(message = "Not found.") {
    super(message, { status: 404 });
    this.name = "NotFoundError";
  }
}

/** Thrown when an abuse control rejects a request. */
export class RateLimitError extends AppError {
  readonly retryAfterSeconds: number;

  constructor(message: string, retryAfterSeconds: number) {
    super(message, { status: 429 });
    this.name = "RateLimitError";
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/**
 * `redirect()` and `notFound()` work by throwing. Catch-all error handlers must
 * re-throw those instead of swallowing them into an error message.
 */
export function isNextControlFlowError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof (error as { digest?: unknown }).digest === "string" &&
    ((error as { digest: string }).digest === "NEXT_NOT_FOUND" ||
      (error as { digest: string }).digest.startsWith("NEXT_REDIRECT"))
  );
}

export function logError(scope: string, error: unknown) {
  const detail =
    error instanceof Error
      ? { name: error.name, message: error.message, stack: error.stack }
      : error;

  console.error(`[protected-assets] ${scope}`, detail);
}

/**
 * Convert an unknown thrown value into a message that is safe to render.
 * Unrecognised errors are logged and reported as `fallback` so that database
 * internals never reach the client.
 */
export function toUserMessage(
  error: unknown,
  fallback: string,
  scope = "unhandled",
): string {
  if (isAppError(error)) {
    return error.message;
  }

  logError(scope, error);
  return fallback;
}

export function toFieldErrors(error: unknown): Record<string, string> | undefined {
  return isAppError(error) ? error.fieldErrors : undefined;
}
