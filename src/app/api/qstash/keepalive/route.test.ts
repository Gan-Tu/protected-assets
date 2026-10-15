import { createHash, createHmac } from "node:crypto";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GET, POST } from "./route";

const callbackUrl = "https://vault.example.com/api/qstash/keepalive";
const currentKey = "test-current-signing-key";
const nextKey = "test-next-signing-key";
const fetchMock = vi.fn<typeof fetch>();

// Exercise the real QStash verifier and Supabase HTTP client. Only the
// outbound database request is replaced, so these tests cannot touch live data.
function signature(body = "", key = currentKey, url = callbackUrl) {
  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: "HS256" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({
    iss: "Upstash",
    sub: url,
    exp: now + 60,
    nbf: now - 1,
    body: createHash("sha256").update(body).digest("base64url"),
  })).toString("base64url");
  const input = `${header}.${payload}`;
  return `${input}.${createHmac("sha256", key).update(input).digest("base64url")}`;
}

function request(method = "GET", body = "", token = signature(body)) {
  return new Request(callbackUrl, {
    method,
    headers: { "upstash-signature": token },
    ...(method === "POST" ? { body } : {}),
  });
}

beforeEach(() => {
  vi.stubEnv("QSTASH_CURRENT_SIGNING_KEY", currentKey);
  vi.stubEnv("QSTASH_NEXT_SIGNING_KEY", nextKey);
  // The auto-release callback setting must not affect keepalive delivery.
  vi.stubEnv("QSTASH_CALLBACK_URL", "https://other.example.com");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://database.example.com");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test-service-role-key");
  vi.stubGlobal("fetch", fetchMock);
  vi.spyOn(console, "error").mockImplementation(() => {});
  fetchMock.mockReset();
  fetchMock.mockImplementation(async () => Response.json([{ id: "private-id" }]));
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("QStash Supabase keepalive", () => {
  it.each([
    ["GET", GET, currentKey],
    ["POST", POST, currentKey],
    ["GET", GET, nextKey],
    ["POST", POST, nextKey],
  ] as const)("accepts signed %s requests (including key rotation)", async (method, handler, key) => {
    const body = method === "POST" ? '{ "ping": true }' : "";
    const response = await handler(request(method, body, signature(body, key)));

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, options] = fetchMock.mock.calls[0];
    expect(String(url)).toBe("https://database.example.com/rest/v1/profiles?select=id&limit=1");
    expect(options?.method).toBe("GET");
    expect(options?.signal).toBeInstanceOf(AbortSignal);
  });

  it("queries again on repeated deliveries and succeeds with an empty table", async () => {
    fetchMock.mockImplementation(async () => Response.json([]));
    expect((await GET(request())).status).toBe(200);
    expect((await GET(request())).status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it.each([
    ["missing signature", () => new Request(callbackUrl)],
    ["invalid signature", () => request("GET", "", "invalid")],
    ["wrong destination", () => request("GET", "", signature("", currentKey, "https://elsewhere.example.com"))],
    ["changed body", () => request("POST", "changed", signature("original"))],
  ])("rejects %s before contacting Supabase", async (_label, makeRequest) => {
    const response = await POST(makeRequest());
    expect(response.status).toBe(401);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("fails closed when signing keys are missing", async () => {
    vi.stubEnv("QSTASH_CURRENT_SIGNING_KEY", "");
    const response = await GET(request());
    expect(response.status).toBe(503);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns a retryable error without database details", async () => {
    fetchMock.mockImplementation(async () => Response.json({
      code: "42501",
      message: "private database error",
    }, { status: 403 }));
    const response = await GET(request());
    expect(response.status).toBe(503);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toEqual({ ok: false, error: "Supabase keepalive failed" });
  });

  it("returns a retryable error when Supabase configuration is missing", async () => {
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    const response = await GET(request());
    expect(response.status).toBe(503);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
