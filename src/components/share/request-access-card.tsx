import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export const REQUEST_ACCESS_TITLE_ID = "request-access-title";

/** The floating white surface the request form and its success state share. */
export function RequestAccessCard({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className={cn("gap-6 shadow-lg sm:py-6", className)}>{children}</Card>
  );
}

export function RequestAccessHeader() {
  return (
    <CardHeader className="gap-1.5 sm:px-6">
      <h2
        id={REQUEST_ACCESS_TITLE_ID}
        className="text-xl leading-7 font-semibold tracking-tight text-foreground"
      >
        Request access
      </h2>
      <p className="text-sm leading-relaxed text-pretty text-muted-foreground">
        The owner will review your request and reply by email.
      </p>
    </CardHeader>
  );
}

export function RequestAccessBody({ children }: { children: React.ReactNode }) {
  return <CardContent className="sm:px-6">{children}</CardContent>;
}
