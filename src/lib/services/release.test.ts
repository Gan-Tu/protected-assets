import { describe, expect, it } from "vitest";

import {
  buildStoredReleaseNote,
  isAttachableFile,
  isRetryableReleaseError,
  planFileDelivery,
} from "@/lib/services/release";
import { AppError } from "@/lib/errors";
import type { AssetFile } from "@/lib/types";

function file(overrides: Partial<AssetFile>): AssetFile {
  return {
    id: "file-id",
    asset_id: "asset-id",
    owner_id: "owner-id",
    storage_path: "owner/asset/file.pdf",
    file_name: "file.pdf",
    file_size: 1024,
    content_type: "application/pdf",
    sort_order: 0,
    created_at: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("isAttachableFile", () => {
  it("accepts known document content types", () => {
    expect(isAttachableFile(file({ content_type: "application/pdf" }))).toBe(
      true,
    );
  });

  it("falls back to the extension when the content type is missing", () => {
    expect(
      isAttachableFile(file({ content_type: null, file_name: "notes.MD" })),
    ).toBe(true);
  });

  it("rejects executables and unknown types", () => {
    expect(
      isAttachableFile(
        file({ content_type: "application/x-msdownload", file_name: "a.exe" }),
      ),
    ).toBe(false);
    expect(
      isAttachableFile(file({ content_type: null, file_name: "archive.zip" })),
    ).toBe(false);
  });
});

describe("planFileDelivery", () => {
  it("attaches small documents and links the rest", () => {
    const plan = planFileDelivery(
      [
        file({ id: "a", file_size: 100 }),
        file({ id: "b", file_size: 100, file_name: "big.zip", content_type: null }),
      ],
      1000,
    );

    expect(plan.attach.map((entry) => entry.id)).toEqual(["a"]);
    expect(plan.link.map((entry) => entry.id)).toEqual(["b"]);
  });

  it("stops attaching once the byte budget is spent", () => {
    const plan = planFileDelivery(
      [
        file({ id: "a", file_size: 600 }),
        file({ id: "b", file_size: 600 }),
        file({ id: "c", file_size: 100 }),
      ],
      1000,
    );

    // 'b' overflows the budget; 'c' still fits in what is left.
    expect(plan.attach.map((entry) => entry.id)).toEqual(["a", "c"]);
    expect(plan.link.map((entry) => entry.id)).toEqual(["b"]);
  });

  it("links files with an unknown size rather than guessing", () => {
    const plan = planFileDelivery([file({ id: "a", file_size: null })], 1000);

    expect(plan.attach).toHaveLength(0);
    expect(plan.link.map((entry) => entry.id)).toEqual(["a"]);
  });

  it("never loses a file between the two buckets", () => {
    const files = [
      file({ id: "a", file_size: 10 }),
      file({ id: "b", file_size: null }),
      file({ id: "c", file_name: "x.zip", content_type: null }),
    ];
    const plan = planFileDelivery(files, 100);

    expect(plan.attach.length + plan.link.length).toBe(files.length);
  });
});

describe("buildStoredReleaseNote", () => {
  it("combines both notes with labels", () => {
    expect(buildStoredReleaseNote("standing note", "one-off")).toBe(
      "Release note:\nstanding note\n\nApproval note:\none-off",
    );
  });

  it("passes a single note through unlabelled", () => {
    expect(buildStoredReleaseNote("standing", null)).toBe("standing");
    expect(buildStoredReleaseNote(null, "one-off")).toBe("one-off");
    expect(buildStoredReleaseNote(null, null)).toBeNull();
  });
});

describe("isRetryableReleaseError", () => {
  it("retries infrastructure failures", () => {
    expect(isRetryableReleaseError(new Error("socket hang up"))).toBe(true);
    expect(
      isRetryableReleaseError(new AppError("mailer down", { status: 502 })),
    ).toBe(true);
  });

  it("does not retry permanent client errors", () => {
    expect(
      isRetryableReleaseError(new AppError("request gone", { status: 404 })),
    ).toBe(false);
  });
});
