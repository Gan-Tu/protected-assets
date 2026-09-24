"use client";

import { useFormStatus } from "react-dom";

import {
  Button,
  type ButtonSize,
  type ButtonVariant,
} from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

/**
 * Feedback is immediate: the spinner appears on the same frame as the click,
 * well before the server action resolves.
 */
export function SubmitButton({
  children,
  pendingLabel = "Saving…",
  className,
  variant,
  size,
  disabled = false,
  form,
}: {
  children: React.ReactNode;
  pendingLabel?: string;
  className?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  form?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      form={form}
      className={className}
      variant={variant}
      size={size}
      disabled={pending || disabled}
      aria-busy={pending || undefined}
    >
      {pending ? (
        <>
          <Spinner />
          {pendingLabel}
        </>
      ) : (
        children
      )}
    </Button>
  );
}
