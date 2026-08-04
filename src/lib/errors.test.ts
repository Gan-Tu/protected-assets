import { describe, expect, it, vi } from "vitest";

import {
  AppError,
  NotFoundError,
  RateLimitError,
  isNextControlFlowError,
  toUserMessage,
} from "@/lib/errors";

describe("toUserMessage", () => {
  it("passes AppError messages through", () => {
    expect(toUserMessage(new AppError("That slug is taken."), "fallback")).toBe(
      "That slug is taken.",
    );
  });

  it("hides database internals behind the fallback", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    // Shape of a PostgREST error: not an Error instance, and full of schema
    // detail we must never render.
    const pgError = {
      message: 'duplicate key value violates unique constraint "assets_slug_key"',
      code: "23505",
      details: "Key (slug)=(deck) already exists.",
    };

    expect(toUserMessage(pgError, "Unable to save asset.")).toBe(
      "Unable to save asset.",
    );
    expect(toUserMessage(new Error("connect ECONNREFUSED"), "Nope.")).toBe(
      "Nope.",
    );

    spy.mockRestore();
  });

  it("keeps subclass messages", () => {
    expect(toUserMessage(new NotFoundError(), "fallback")).toBe("Not found.");
    expect(toUserMessage(new RateLimitError("Slow down.", 60), "fallback")).toBe(
      "Slow down.",
    );
  });
});

describe("isNextControlFlowError", () => {
  it("recognizes redirect and notFound signals", () => {
    expect(
      isNextControlFlowError(
        Object.assign(new Error(), { digest: "NEXT_REDIRECT;replace;/x;307;" }),
      ),
    ).toBe(true);
    expect(
      isNextControlFlowError(
        Object.assign(new Error(), { digest: "NEXT_NOT_FOUND" }),
      ),
    ).toBe(true);
  });

  it("ignores ordinary errors", () => {
    expect(isNextControlFlowError(new Error("boom"))).toBe(false);
    expect(isNextControlFlowError({ digest: 12345 })).toBe(false);
    expect(isNextControlFlowError(null)).toBe(false);
  });
});
