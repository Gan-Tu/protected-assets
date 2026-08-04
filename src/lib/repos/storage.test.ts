import { describe, expect, it } from "vitest";

import { buildStoragePath, isOwnedStoragePath } from "@/lib/repos/storage";

const ownerId = "11111111-1111-4111-8111-111111111111";
const assetId = "22222222-2222-4222-8222-222222222222";

describe("buildStoragePath", () => {
  it("namespaces objects under owner and asset", () => {
    const path = buildStoragePath({
      ownerId,
      assetId,
      fileName: "Q1 Report.pdf",
      index: 0,
      now: 1700000000000,
    });

    expect(path).toBe(
      `${ownerId}/${assetId}/1700000000000-0-q1-report.pdf`,
    );
  });

  it("strips traversal and separators out of the file name", () => {
    const path = buildStoragePath({
      ownerId,
      assetId,
      fileName: "../../etc/passwd",
      index: 1,
      now: 1,
    });

    expect(path.startsWith(`${ownerId}/${assetId}/`)).toBe(true);
    expect(path).not.toContain("..");
    expect(isOwnedStoragePath(path, ownerId, assetId)).toBe(true);
  });

  it("survives a missing extension", () => {
    const path = buildStoragePath({
      ownerId,
      assetId,
      fileName: "README",
      index: 2,
      now: 7,
    });

    expect(path).toBe(`${ownerId}/${assetId}/7-2-readme`);
  });

  it("does not let a crafted extension escape the prefix", () => {
    const path = buildStoragePath({
      ownerId,
      assetId,
      fileName: "evil.pdf/../../other-owner/x",
      index: 0,
      now: 3,
    });

    expect(isOwnedStoragePath(path, ownerId, assetId)).toBe(true);
  });
});

describe("isOwnedStoragePath", () => {
  const otherOwner = "33333333-3333-4333-8333-333333333333";

  it("accepts a path inside the owner's asset prefix", () => {
    expect(
      isOwnedStoragePath(`${ownerId}/${assetId}/1-0-a.pdf`, ownerId, assetId),
    ).toBe(true);
  });

  it("rejects another owner's prefix", () => {
    expect(
      isOwnedStoragePath(
        `${otherOwner}/${assetId}/1-0-a.pdf`,
        ownerId,
        assetId,
      ),
    ).toBe(false);
  });

  it("rejects another asset under the same owner", () => {
    expect(
      isOwnedStoragePath(
        `${ownerId}/44444444-4444-4444-8444-444444444444/1-0-a.pdf`,
        ownerId,
        assetId,
      ),
    ).toBe(false);
  });

  it("rejects traversal and absolute paths", () => {
    expect(
      isOwnedStoragePath(
        `${ownerId}/${assetId}/../../${otherOwner}/x.pdf`,
        ownerId,
        assetId,
      ),
    ).toBe(false);
    expect(
      isOwnedStoragePath(`/${ownerId}/${assetId}/x.pdf`, ownerId, assetId),
    ).toBe(false);
  });

  it("rejects a prefix that merely starts with the owner id", () => {
    expect(
      isOwnedStoragePath(`${ownerId}-evil/${assetId}/x.pdf`, ownerId, assetId),
    ).toBe(false);
  });
});
