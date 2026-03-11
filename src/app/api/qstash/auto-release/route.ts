import { Receiver } from "@upstash/qstash";

import { releaseRequest } from "@/lib/data";
import { getQStashCallbackUrl } from "@/lib/qstash";

export async function POST(request: Request) {
  const signature = request.headers.get("upstash-signature");
  const rawBody = await request.text();
  const currentSigningKey = process.env.QSTASH_CURRENT_SIGNING_KEY;
  const nextSigningKey = process.env.QSTASH_NEXT_SIGNING_KEY;

  if (!currentSigningKey || !nextSigningKey) {
    return Response.json(
      { ok: false, error: "QStash signing keys are not configured" },
      { status: 500 },
    );
  }

  if (!signature) {
    return Response.json({ ok: false, error: "Missing signature" }, { status: 401 });
  }

  const receiver = new Receiver({
    currentSigningKey,
    nextSigningKey,
  });

  const isValid = await receiver.verify({
    body: rawBody,
    signature,
    url: `${getQStashCallbackUrl()}/api/qstash/auto-release`,
  });

  if (!isValid) {
    return Response.json({ ok: false, error: "Invalid signature" }, { status: 401 });
  }

  const body = JSON.parse(rawBody) as { requestId?: string };

  if (!body.requestId) {
    return Response.json({ ok: false, error: "Missing requestId" }, { status: 400 });
  }

  await releaseRequest(body.requestId, "auto_approved");

  return Response.json({ ok: true });
}
