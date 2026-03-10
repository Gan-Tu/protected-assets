"use client";

import { useState, useTransition } from "react";

import { CopyIcon, CheckIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

export function CopyLinkButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="cursor-pointer gap-2 w-full sm:w-auto"
      onClick={() => {
        startTransition(async () => {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1600);
        });
      }}
      disabled={isPending}
    >
      {copied ? <CheckIcon className="size-3.5" /> : <CopyIcon className="size-3.5" />}
      {copied ? "Copied" : "Copy URL"}
    </Button>
  );
}
