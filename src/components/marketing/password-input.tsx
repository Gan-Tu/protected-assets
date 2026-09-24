"use client";

import { useEffect, useRef, useState } from "react";
import { EyeIcon, EyeOffIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/**
 * Password field with a reveal toggle. The toggle keeps one label and reports
 * its state through `aria-pressed` ("Show password, pressed" = visible), per
 * the WAI-ARIA toggle-button pattern: a label that flips as well would make
 * the announced state ambiguous.
 */
export function PasswordInput({
  className,
  ...props
}: Omit<React.ComponentProps<"input">, "type">) {
  const [visible, setVisible] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Mask again on submit so password managers still see a password field and
  // offer to save it.
  useEffect(() => {
    const form = inputRef.current?.form;
    if (!form) return;

    const mask = () => setVisible(false);
    form.addEventListener("submit", mask);
    return () => form.removeEventListener("submit", mask);
  }, []);

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        type={visible ? "text" : "password"}
        className={cn("pr-12", className)}
        {...props}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label="Show password"
        aria-pressed={visible}
        aria-controls={props.id}
        onClick={() => setVisible((current) => !current)}
        className="absolute top-1/2 right-1.5 -translate-y-1/2 text-muted-foreground hover:text-foreground aria-pressed:text-foreground"
      >
        {visible ? <EyeOffIcon aria-hidden /> : <EyeIcon aria-hidden />}
      </Button>
    </div>
  );
}
