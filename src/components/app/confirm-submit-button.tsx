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
import { Button } from "@/components/ui/button";

export function ConfirmSubmitButton({
  formId,
  triggerLabel,
  title,
  description,
  confirmLabel,
  triggerClassName,
  triggerVariant = "outline",
  confirmVariant = "destructive",
  icon,
}: {
  formId: string;
  triggerLabel: string;
  title: string;
  description: string;
  confirmLabel: string;
  triggerClassName?: string;
  triggerVariant?: "default" | "outline" | "secondary" | "ghost" | "destructive" | "link";
  confirmVariant?: "default" | "outline" | "secondary" | "ghost" | "destructive" | "link";
  icon?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const descriptionId = useId();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button type="button" variant={triggerVariant} className={triggerClassName} />
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
          <DialogClose render={<Button type="button" variant="outline" className="cursor-pointer" />}>
            Cancel
          </DialogClose>
          <Button
            type="submit"
            form={formId}
            variant={confirmVariant}
            className="cursor-pointer"
            onClick={() => setOpen(false)}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
