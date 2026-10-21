import { Receiver } from "@upstash/qstash";

import { logError } from "@/lib/errors";
import { createAdminSupabaseClient } from "@/lib/supabase/server";

// Every delivery must reach Postgres, including GET requests and retries.
export const dynamic = "force-dynamic";

function json(body: { ok: boolean; error?: string }, status = 200) {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

async function keepalive(request: Request) {
  const currentSigningKey = process.env.QSTASH_CURRENT_SIGNING_KEY;
  const nextSigningKey = process.env.QSTASH_NEXT_SIGNING_KEY;

  if (!currentSigningKey || !nextSigningKey) {
    return json({ ok: false, error: "QStash signing keys are not configured" }, 503);
  }

  const signature = request.headers.get("upstash-signature");
  if (!signature) {
    return json({ ok: false, error: "Missing signature" }, 401);
  }

  try {
    const receiver = new Receiver({ currentSigningKey, nextSigningKey });
    const isValid = await receiver.verify({
      body: await request.text(),
      signature,
      url: request.url,
    });

    if (!isValid) {
      return json({ ok: false, error: "Invalid signature" }, 401);
    }
  } catch (error) {
    // Do not log the JWT, request body, or verifier message (which can contain them).
    logError("qstash.keepalive.signature", {
      name: error instanceof Error ? error.name : "UnknownVerificationError",
      method: request.method,
    });
    return json({ ok: false, error: "Invalid signature" }, 401);
  }

  try {
    // A bounded read of an existing table works even when it is empty. This
    // operational probe uses no caller input and never returns profile data.
    const { error } = await createAdminSupabaseClient()
      .from("profiles")
      .select("id")
      .limit(1)
      .abortSignal(AbortSignal.timeout(10_000));

    if (error) throw error;

    return json({ ok: true });
  } catch (error) {
    logError("qstash.keepalive", error);
    // Report database/configuration failures so QStash retries the delivery.
    return json({ ok: false, error: "Supabase keepalive failed" }, 503);
  }
}

export { keepalive as GET, keepalive as POST };
