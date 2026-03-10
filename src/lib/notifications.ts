import "server-only";

import { Resend } from "resend";

import { formatRelativeWindow, getBaseUrl } from "@/lib/utils";

type EmailPayload = {
  to: string[];
  subject: string;
  html: string;
  text: string;
  idempotencyKey: string;
  attachments?: {
    filename: string;
    content: Buffer;
    content_type?: string;
  }[];
};

const resend =
  process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL
    ? new Resend(process.env.RESEND_API_KEY)
    : null;

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderMultilineText(value: string) {
  return escapeHtml(value).replaceAll("\n", "<br />");
}

function summarizeUrl(value: string) {
  try {
    const url = new URL(value);
    return `${url.hostname}${url.pathname === "/" ? "" : url.pathname}`.slice(0, 60);
  } catch {
    return value.slice(0, 60);
  }
}

function renderEmailLayout(input: {
  eyebrow: string;
  title: string;
  intro: string;
  accent: "amber" | "emerald" | "rose";
  sections: string[];
  cta?: { label: string; url: string };
  footer?: string;
}) {
  const accentStyles = {
    amber: {
      shell: "linear-gradient(135deg, #fff7ed 0%, #ffffff 60%)",
      pill: "#f59e0b",
      panel: "#fffbeb",
    },
    emerald: {
      shell: "linear-gradient(135deg, #ecfdf5 0%, #ffffff 60%)",
      pill: "#059669",
      panel: "#ecfdf5",
    },
    rose: {
      shell: "linear-gradient(135deg, #fff1f2 0%, #ffffff 60%)",
      pill: "#e11d48",
      panel: "#fff1f2",
    },
  }[input.accent];

  return `
    <div style="margin:0; background:#f5f5f4; padding:32px 16px; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color:#18181b;">
      <div style="max-width:640px; margin:0 auto; border:1px solid #e4e4e7; border-radius:28px; overflow:hidden; background:#ffffff; box-shadow:0 24px 60px rgba(24,24,27,0.08);">
        <div style="padding:32px; background:${accentStyles.shell}; border-bottom:1px solid #f4f4f5;">
          <div style="display:inline-block; padding:7px 12px; border-radius:999px; background:${accentStyles.pill}; color:#ffffff; font-size:11px; font-weight:700; letter-spacing:0.18em; text-transform:uppercase;">
            ${escapeHtml(input.eyebrow)}
          </div>
          <h1 style="margin:18px 0 10px; font-size:28px; line-height:1.15; letter-spacing:-0.03em; color:#09090b;">
            ${escapeHtml(input.title)}
          </h1>
          <p style="margin:0; font-size:15px; line-height:1.8; color:#52525b;">
            ${escapeHtml(input.intro)}
          </p>
        </div>
        <div style="padding:28px 32px;">
          ${input.sections.join("")}
          ${
            input.cta
              ? `<div style="margin-top:28px;">
                  <a href="${escapeHtml(input.cta.url)}" style="display:inline-block; border-radius:999px; background:#111827; color:#ffffff; text-decoration:none; font-size:14px; font-weight:700; padding:13px 18px;">
                    ${escapeHtml(input.cta.label)}
                  </a>
                </div>`
              : ""
          }
        </div>
        <div style="padding:18px 32px; border-top:1px solid #f4f4f5; background:${accentStyles.panel}; font-size:12px; line-height:1.7; color:#71717a;">
          ${escapeHtml(input.footer ?? "Protected Assets")}
        </div>
      </div>
    </div>
  `;
}

function renderDetailSection(title: string, rows: { label: string; value: string }[]) {
  return `
    <div style="margin-top:18px; border:1px solid #e4e4e7; border-radius:20px; padding:18px 20px; background:#fafafa;">
      <div style="margin-bottom:12px; font-size:11px; font-weight:700; letter-spacing:0.16em; text-transform:uppercase; color:#71717a;">
        ${escapeHtml(title)}
      </div>
      ${rows
        .map(
          (row) => `
            <div style="padding:${row === rows[0] ? "0 0 10px" : "10px 0"}; ${row === rows[rows.length - 1] ? "" : "border-bottom:1px solid #e4e4e7;"}">
              <div style="font-size:12px; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; color:#a1a1aa; margin-bottom:4px;">
                ${escapeHtml(row.label)}
              </div>
              <div style="font-size:14px; line-height:1.7; color:#18181b;">
                ${row.value}
              </div>
            </div>`,
        )
        .join("")}
    </div>
  `;
}

function renderNoteSection(note: string, title = "Note from owner") {
  return `
    <div style="margin-top:18px; border-radius:20px; padding:18px 20px; background:#f4f4f5; border:1px solid #e4e4e7;">
      <div style="margin-bottom:10px; font-size:11px; font-weight:700; letter-spacing:0.16em; text-transform:uppercase; color:#71717a;">
        ${escapeHtml(title)}
      </div>
      <div style="font-size:14px; line-height:1.8; color:#27272a;">
        ${renderMultilineText(note)}
      </div>
    </div>
  `;
}

function renderResourceSection(input: {
  links?: { name: string; url: string }[];
  attachedFiles?: { name: string }[];
  fileLinks?: { name: string; url: string }[];
}) {
  const resources = [
    ...(input.links ?? []).map(
      (link) => `
        <div style="padding:16px 18px; border-radius:18px; border:1px solid #d4d4d8; background:#ffffff;">
          <div style="font-size:12px; font-weight:700; letter-spacing:0.12em; text-transform:uppercase; color:#a1a1aa; margin-bottom:6px;">Protected link</div>
          <a href="${escapeHtml(link.url)}" style="font-size:14px; font-weight:600; color:#2563eb; text-decoration:underline;">
            ${escapeHtml(summarizeUrl(link.url))}
          </a>
        </div>
      `
    ),
    ...(input.attachedFiles ?? []).map(
      (file) => `
        <div style="padding:16px 18px; border-radius:18px; border:1px solid #d4d4d8; background:#ffffff;">
          <div style="font-size:12px; font-weight:700; letter-spacing:0.12em; text-transform:uppercase; color:#a1a1aa; margin-bottom:6px;">Email attachment</div>
          <div style="font-size:14px; font-weight:600; color:#111827;">${escapeHtml(file.name)}</div>
        </div>
      `,
    ),
    ...(input.fileLinks ?? []).map(
      (file) => `
        <a href="${escapeHtml(file.url)}" style="display:block; padding:16px 18px; border-radius:18px; border:1px solid #d4d4d8; background:#ffffff; text-decoration:none;">
          <div style="font-size:12px; font-weight:700; letter-spacing:0.12em; text-transform:uppercase; color:#a1a1aa; margin-bottom:6px;">Secure file link</div>
          <div style="font-size:14px; font-weight:600; color:#111827;">${escapeHtml(file.name)}</div>
        </a>
      `,
    ),
  ].filter(Boolean);

  if (!resources.length) {
    return "";
  }

  return `
    <div style="margin-top:18px;">
      <div style="margin-bottom:12px; font-size:11px; font-weight:700; letter-spacing:0.16em; text-transform:uppercase; color:#71717a;">
        Access resources
      </div>
      <div style="display:grid; gap:12px;">
        ${resources.join("")}
      </div>
    </div>
  `;
}

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
      attachments: payload.attachments,
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
  const ownerLabel = input.ownerName?.trim() || input.ownerEmail;

  if (input.sendEmailNotification) {
    await sendEmail({
      to: [input.ownerEmail],
      subject: `Access request for ${input.assetName}`,
      idempotencyKey: `owner-request/${input.requestId}`,
      html: renderEmailLayout({
        eyebrow: "Access request",
        title: `${input.requesterEmail} wants access`,
        intro: `A new request came in for ${input.assetName}. Review the request and either release the asset or decline it.`,
        accent: "amber",
        sections: [
          renderDetailSection("Request details", [
            { label: "Requester", value: escapeHtml(input.requesterEmail) },
            { label: "Asset", value: escapeHtml(input.assetName) },
            { label: "Auto-release window", value: escapeHtml(timeframe) },
            {
              label: "Share page",
              value: `<a href="${escapeHtml(shareUrl)}" style="color:#111827;">${escapeHtml(shareUrl)}</a>`,
            },
          ]),
          renderNoteSection(input.reason, "Requester message"),
        ],
        cta: {
          label: "Review request",
          url: dashboardUrl,
        },
        footer: `Notification for ${ownerLabel}`,
      }),
      text: `New access request\n\nRequester: ${input.requesterEmail}\nAsset: ${input.assetName}\nReason:\n${input.reason}\n\nAuto-release window: ${timeframe}\nReview in dashboard: ${dashboardUrl}\nShare page: ${shareUrl}`,
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
      Body: `${input.requesterEmail} requested assets \'${input.assetName}\'. Reason: ${input.reason}`,
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
  releaseNote?: string | null;
  decisionNote?: string | null;
  releaseMode: "approved" | "auto_approved";
  links?: { name: string; url: string }[];
  attachments?: { filename: string; content: Buffer; content_type?: string }[];
  fileLinks?: { name: string; url: string }[];
  shareUrl: string;
}) {
  const releaseCopy =
    input.releaseMode === "auto_approved"
      ? "The timed release window has passed, so your access was automatically approved."
      : "Your access request was approved.";

  await sendEmail({
    to: [input.requesterEmail],
    subject: `${input.assetName} is ready`,
    idempotencyKey: `requester-release/${input.requestId}`,
    html: renderEmailLayout({
      eyebrow: input.releaseMode === "auto_approved" ? "Auto-released" : "Approved",
      title: "Your access is ready",
      intro: releaseCopy,
      accent: "emerald",
      sections: [
        renderDetailSection("Asset details", [
          { label: "Asset", value: escapeHtml(input.assetName) },
          ...(input.assetDescription
            ? [{ label: "Description", value: renderMultilineText(input.assetDescription) }]
            : []),
          {
            label: "Share page",
            value: `<a href="${escapeHtml(input.shareUrl)}" style="color:#111827;">${escapeHtml(input.shareUrl)}</a>`,
          },
        ]),
        ...(input.releaseNote ? [renderNoteSection(input.releaseNote, "Release note")] : []),
        ...(input.decisionNote ? [renderNoteSection(input.decisionNote, "Approval note")] : []),
        renderResourceSection({
          links: input.links,
          attachedFiles: input.attachments?.map((attachment) => ({
            name: attachment.filename,
          })),
          fileLinks: input.fileLinks,
        }),
      ],
      footer: "This message contains secure access details for a protected asset.",
    }),
    text: `${releaseCopy}\n\nAsset: ${input.assetName}\n${input.assetDescription ? `Description: ${input.assetDescription}\n` : ""}Share page: ${input.shareUrl}\n${input.releaseNote ? `\nAccess Note:\n${input.releaseNote}\n` : ""}${input.decisionNote ? `\nApproval note:\n${input.decisionNote}\n` : ""}${input.links?.map((link) => `Protected link ${summarizeUrl(link.url)}: ${link.url}`).join("\n") ?? ""}${input.attachments?.length ? `\nAttached files:\n${input.attachments.map((attachment) => `- ${attachment.filename}`).join("\n")}\n` : ""}${input.fileLinks?.map((file) => `\nDownload ${file.name}: ${file.url}`).join("") ?? ""}`,
    attachments: input.attachments,
  });
}

export async function sendRequesterDeniedEmail(input: {
  requestId: string;
  requesterEmail: string;
  assetName: string;
  decisionNote?: string | null;
}) {
  await sendEmail({
    to: [input.requesterEmail],
    subject: `Request declined for ${input.assetName}`,
    idempotencyKey: `requester-denied/${input.requestId}`,
    html: renderEmailLayout({
      eyebrow: "Declined",
      title: "Request declined",
      intro: `The owner declined your request for ${input.assetName}.`,
      accent: "rose",
      sections: [
        renderDetailSection("Asset details", [
          { label: "Asset", value: escapeHtml(input.assetName) },
          { label: "Status", value: "Declined" },
        ]),
        ...(input.decisionNote ? [renderNoteSection(input.decisionNote)] : []),
      ],
      footer: "You can contact the asset owner directly if you need more context.",
    }),
    text: `The owner declined your request for ${input.assetName}.${input.decisionNote ? `\n\nNote from owner:\n${input.decisionNote}` : ""}`,
  });
}
