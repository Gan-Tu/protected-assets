import Link from "next/link";
import { ChevronLeftIcon } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Eyebrow link back to the overview; the negative margin aligns the chevron with the title. */
export function BackLink({
  href = "/dashboard",
  label = "Overview",
}: {
  href?: string;
  label?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        buttonVariants({ variant: "ghost", size: "sm" }),
        "-ml-2.5 gap-1 pr-2.5 pl-1.5 text-muted-foreground hover:text-foreground",
      )}
    >
      <ChevronLeftIcon className="size-4" aria-hidden />
      {label}
    </Link>
  );
}
