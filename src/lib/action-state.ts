/**
 * Shared shape for every server action result. Actions never throw at the
 * client: they return a discriminated state so forms can render inline errors,
 * including per-field messages from zod.
 */
export type ActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string>;
};

export const IDLE_STATE: ActionState = { status: "idle" };

export function successState(message?: string): ActionState {
  return { status: "success", message };
}

export function errorState(
  message: string,
  fieldErrors?: Record<string, string>,
): ActionState {
  return { status: "error", message, fieldErrors };
}
