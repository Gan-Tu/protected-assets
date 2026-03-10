import "server-only";

import { Resend } from "resend";

import { formatRelativeWindow, getBaseUrl } from "@/lib/utils";

type EmailPayload = {
  to: string[];
  subject: string;
  html: string;
  text: string;
  idempotencyKey: string;
};

const resend =
  process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL
    ? new Resend(process.env.RESEND_API_KEY)
    : null;

async function sendEmail(payload: EmailPayload) {
  if (!resend || !process.env.RESEND_FROM_EMAIL) {
    return { skipped: true };
  }

  await resend.emails.send(
    {
      from: process.env.RESEND_FROM_EMAIL,
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
    },
    { idempotencyKey: payload.idempotencyKey },
  );

  return { skipped: false };
}

export async function sendOwnerRequestNotification(input: {
  ownerEmail: string;
  ownerPhone: string | null;
  sendEmailNotification: boolean;
  sendSmsNotification: boolean;
  ownerName?: string | null;
  assetName: string;
  assetSlug: string;
  requesterEmail: string;
  reason: string;
  autoApproveDelaySeconds: number;
  requestId: string;
}) {
  const dashboardUrl = `${getBaseUrl()}/dashboard`;
  const shareUrl = `${getBaseUrl()}/a/${input.assetSlug}`;
  const timeframe =
    input.autoApproveDelaySeconds > 0
      ? formatRelativeWindow(input.autoApproveDelaySeconds)
      : "manual approval only";

  if (input.sendEmailNotification) {
    await sendEmail({
      to: [input.ownerEmail],
      subject: `Access request for ${input.assetName}`,
      idempotencyKey: `owner-request/${input.requestId}`,
      html: `
        <div style="font-family: Inter, system-ui, sans-serif; max-width: 560px; margin: 0 auto; color: #101828;">
          <h1 style="font-size: 22px; margin-bottom: 12px;">New access request</h1>
          <p style="font-size: 15px; line-height: 1.7;">
            <strong>${input.requesterEmail}</strong> requested access to <strong>${input.assetName}</strong>.
          </p>
          <p style="font-size: 15px; line-height: 1.7; padding: 14px 16px; border-radius: 16px; background: #f5f7fb;">
            ${input.reason}
          </p>
          <p style="font-size: 14px; color: #475467; line-height: 1.7;">
            Auto-approve window: ${timeframe}<br />
            Share page: <a href="${shareUrl}">${shareUrl}</a>
          </p>
          <p style="margin-top: 24px;">
            <a href="${dashboardUrl}" style="display: inline-block; background: #111827; color: white; text-decoration: none; padding: 12px 16px; border-radius: 999px;">
              Review request
            </a>
          </p>
        </div>
      `,
      text: `${input.requesterEmail} requested access to ${input.assetName}.\n\nReason: ${input.reason}\n\nAuto-approve window: ${timeframe}\nReview in dashboard: ${dashboardUrl}\nShare page: ${shareUrl}`,
    });
  }

  if (
    input.sendSmsNotification &&
    input.ownerPhone &&
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_FROM_NUMBER
  ) {
    const auth = Buffer.from(
      `${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`,
    ).toString("base64");

    const body = new URLSearchParams({
      To: input.ownerPhone,
      From: process.env.TWILIO_FROM_NUMBER,
      Body: `${input.requesterEmail} requested ${input.assetName}. Review: ${dashboardUrl}`,
    });

    await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body,
      },
    );
  }
}

export async function sendRequesterReleaseEmail(input: {
  requestId: string;
  requesterEmail: string;
  assetName: string;
  assetDescription: string | null;
  releaseMode: "approved" | "auto_approved";
  linkUrl?: string | null;
  fileLinks?: { name: string; url: string }[];
  shareUrl: string;
}) {
  const releaseCopy =
    input.releaseMode === "auto_approved"
      ? "The timed release window has passed, so your access was automatically approved."
      : "Your access request was approved.";

  const linksMarkup =
    input.linkUrl || (input.fileLinks?.length ?? 0) > 0
      ? `
        <div style="margin-top: 20px; padding: 16px; border-radius: 18px; background: #f5f7fb;">
          ${
            input.linkUrl
              ? `<p style="margin: 0 0 8px 0;"><a href="${input.linkUrl}">Open protected link</a></p>`
              : ""
          }
          ${
            input.fileLinks
              ?.map(
                (file) =>
                  `<p style="margin: 0 0 8px 0;"><a href="${file.url}">Download ${file.name}</a></p>`,
              )
              .join("") ?? ""
          }
        </div>
      `
      : "";

  await sendEmail({
    to: [input.requesterEmail],
    subject: `${input.assetName} is ready`,
    idempotencyKey: `requester-release/${input.requestId}`,
    html: `
      <div style="font-family: Inter, system-ui, sans-serif; max-width: 560px; margin: 0 auto; color: #101828;">
        <h1 style="font-size: 22px; margin-bottom: 12px;">Your access is ready</h1>
        <p style="font-size: 15px; line-height: 1.7;">${releaseCopy}</p>
        <p style="font-size: 15px; line-height: 1.7;">
          Asset: <strong>${input.assetName}</strong><br />
          ${input.assetDescription ? `${input.assetDescription}<br />` : ""}
          Share page: <a href="${input.shareUrl}">${input.shareUrl}</a>
        </p>
        ${linksMarkup}
      </div>
    `,
    text: `${releaseCopy}\n\nAsset: ${input.assetName}\n${input.assetDescription ?? ""}\nShare page: ${input.shareUrl}\n${input.linkUrl ? `Protected link: ${input.linkUrl}\n` : ""}${input.fileLinks?.map((file) => `Download ${file.name}: ${file.url}`).join("\n") ?? ""}`,
  });
}

export async function sendRequesterDeniedEmail(input: {
  requestId: string;
  requesterEmail: string;
  assetName: string;
}) {
  await sendEmail({
    to: [input.requesterEmail],
    subject: `Request declined for ${input.assetName}`,
    idempotencyKey: `requester-denied/${input.requestId}`,
    html: `
      <div style="font-family: Inter, system-ui, sans-serif; max-width: 560px; margin: 0 auto; color: #101828;">
        <h1 style="font-size: 22px; margin-bottom: 12px;">Request declined</h1>
        <p style="font-size: 15px; line-height: 1.7;">
          The owner declined your request for <strong>${input.assetName}</strong>.
        </p>
      </div>
    `,
    text: `The owner declined your request for ${input.assetName}.`,
  });
}
