"use client";

import { useEffect, useRef, useState } from "react";
import { CheckIcon, CopyIcon } from "lucide-react";

import {
  Button,
  type ButtonSize,
  type ButtonVariant,
} from "@/components/ui/button";
import { cn } from "@/lib/utils";

async function writeToClipboard(value: string) {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    // Clipboard API is unavailable on insecure origins and in some embeds.
    const field = document.createElement("textarea");
    field.value = value;
    field.setAttribute("readonly", "");
    field.style.position = "fixed";
    field.style.opacity = "0";
    document.body.appendChild(field);
    field.select();
    const ok = document.execCommand("copy");
    field.remove();
    return ok;
  }
}

/**
 * Copies synchronously from the click (no transition wrapper), then swaps the
 * icon for a check. `iconOnly` keeps a text label for assistive tech.
 */
export function CopyLinkButton({
  value,
  label = "Copy link",
  copiedLabel = "Copied",
  iconOnly = false,
  variant = "outline",
  size,
  className,
}: {
  value: string;
  label?: string;
  copiedLabel?: string;
  iconOnly?: boolean;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const resetRef = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(resetRef.current), []);

  async function copy() {
    const ok = await writeToClipboard(value);
    if (!ok) return;

    setCopied(true);
    window.clearTimeout(resetRef.current);
    resetRef.current = window.setTimeout(() => setCopied(false), 1600);
  }

  const Icon = copied ? CheckIcon : CopyIcon;

  return (
    <Button
      type="button"
      variant={variant}
      size={size ?? (iconOnly ? "icon-sm" : "sm")}
      // Last, so a caller's text colour never masks the copied state.
      className={cn(className, copied && "text-success")}
      onClick={copy}
      aria-label={iconOnly ? (copied ? copiedLabel : label) : undefined}
      title={iconOnly ? label : undefined}
    >
      <Icon
        key={copied ? "copied" : "copy"}
        className={cn(copied && "animate-scale-in")}
        aria-hidden
      />
      {iconOnly ? null : copied ? copiedLabel : label}
      <span className="sr-only" aria-live="polite">
        {copied ? "Link copied to clipboard" : ""}
      </span>
    </Button>
  );
}
