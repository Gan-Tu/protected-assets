"use client";

import { useId, useState } from "react";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Button,
  type ButtonSize,
  type ButtonVariant,
} from "@/components/ui/button";

/**
 * Trigger + confirmation dialog for a destructive plain-form submit. The
 * confirm button submits the form by id, so the form itself can stay a server
 * component.
 */
export function ConfirmSubmitButton({
  formId,
  triggerLabel,
  triggerAriaLabel,
  title,
  description,
  confirmLabel,
  triggerClassName,
  triggerVariant = "outline",
  triggerSize,
  confirmVariant = "destructive",
  icon,
}: {
  formId: string;
  triggerLabel: string;
  /** Required when the trigger is icon-only, so it is not an unlabelled button. */
  triggerAriaLabel?: string;
  title: string;
  description: string;
  confirmLabel: string;
  triggerClassName?: string;
  triggerVariant?: ButtonVariant;
  triggerSize?: ButtonSize;
  confirmVariant?: ButtonVariant;
  icon?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const descriptionId = useId();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            type="button"
            variant={triggerVariant}
            size={triggerSize}
            className={triggerClassName}
            aria-label={triggerAriaLabel ?? (triggerLabel || title)}
          />
        }
      >
        {icon}
        {triggerLabel}
      </DialogTrigger>
      <DialogContent aria-labelledby={titleId} aria-describedby={descriptionId}>
        <DialogHeader>
          <DialogTitle id={titleId}>{title}</DialogTitle>
          <DialogDescription id={descriptionId}>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button type="button" variant="outline" />}>
            Cancel
          </DialogClose>
          <Button
            type="submit"
            form={formId}
            variant={confirmVariant}
            onClick={() => setOpen(false)}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
