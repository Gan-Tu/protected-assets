import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * One card per editor section. The title is a real <h2>, so a long form still
 * has a navigable outline for screen-reader users.
 */
export function EditorCard({
  title,
  description,
  className,
  contentClassName,
  children,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  className?: string;
  contentClassName?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className={cn("gap-6", className)}>
      <CardHeader>
        <CardTitle>
          <h2>{title}</h2>
        </CardTitle>
        {description ? (
          <CardDescription className="text-pretty">{description}</CardDescription>
        ) : null}
      </CardHeader>
      <CardContent className={cn("grid gap-6", contentClassName)}>
        {children}
      </CardContent>
    </Card>
  );
}
