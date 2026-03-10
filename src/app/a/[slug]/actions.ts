"use server";

import { submitAccessRequest } from "@/lib/data";
import { getErrorMessage } from "@/lib/utils";

export type RequestFormState = {
  error?: string;
  success?: string;
};

export async function requestAccessAction(
  _: RequestFormState,
  formData: FormData,
): Promise<RequestFormState> {
  try {
    const result = await submitAccessRequest(formData);

    return {
      success: result.autoApproveLabel
        ? `Request submitted. If the owner does not respond, this asset will auto-release in ${result.autoApproveLabel}.`
        : `Request submitted for ${result.assetName}.`,
    };
  } catch (error) {
    return {
      error: getErrorMessage(error, "Unable to submit access request."),
    };
  }
}
