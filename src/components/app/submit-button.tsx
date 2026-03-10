"use client";

import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ButtonVariant =
  | "default"
  | "outline"
  | "secondary"
  | "ghost"
  | "destructive"
  | "link";
type ButtonSize =
  | "default"
  | "xs"
  | "sm"
  | "lg"
  | "icon"
  | "icon-xs"
  | "icon-sm"
  | "icon-lg";

export function SubmitButton({
  children,
  pendingLabel = "Saving...",
  className,
  variant,
  size,
  disabled = false,
}: {
  children: React.ReactNode;
  pendingLabel?: string;
  className?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      className={cn("cursor-pointer", className)}
      variant={variant}
      size={size}
      disabled={pending || disabled}
    >
      {pending ? pendingLabel : children}
    </Button>
  );
}
