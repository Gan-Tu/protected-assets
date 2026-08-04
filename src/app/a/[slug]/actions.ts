"use server";

import { headers } from "next/headers";

import { errorState, type ActionState } from "@/lib/action-state";
import {
  isNextControlFlowError,
  toFieldErrors,
  toUserMessage,
} from "@/lib/errors";
import { getClientIp } from "@/lib/rate-limit";
import { submitAccessRequest } from "@/lib/services/access-requests";
import {
  accessRequestSchema,
  parseOrThrow,
  readString,
} from "@/lib/validation";

export type RequestFormState = ActionState;

export async function requestAccessAction(
  _: RequestFormState,
  formData: FormData,
): Promise<RequestFormState> {
  try {
    const input = parseOrThrow(accessRequestSchema, {
      slug: readString(formData, "slug"),
      requesterName: readString(formData, "requester_name"),
      requesterEmail: readString(formData, "requester_email"),
      reason: readString(formData, "reason"),
    });

    const requestHeaders = await headers();
    const result = await submitAccessRequest(input, {
      clientIp: getClientIp(requestHeaders),
    });

    if (result.duplicate) {
      return {
        status: "success",
        message: `You already have a request pending for ${result.assetName}. The owner has been notified.`,
      };
    }

    if (result.autoApproveLabel && result.autoReleaseScheduled) {
      return {
        status: "success",
        message: `Request submitted. If the owner does not respond, this asset will auto-release in ${result.autoApproveLabel}.`,
      };
    }

    return {
      status: "success",
      message: `Request submitted for ${result.assetName}.`,
    };
  } catch (error) {
    if (isNextControlFlowError(error)) throw error;

    return errorState(
      toUserMessage(error, "Unable to submit access request.", "access-request"),
      toFieldErrors(error),
    );
  }
}
