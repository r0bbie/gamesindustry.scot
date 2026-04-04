import { cn } from "@/lib/utils";

interface BrokenLinkProps {
  id: string;
  type: string;
  className?: string;
}

export function BrokenLink({ id, type, className }: BrokenLinkProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border border-border bg-muted px-1.5 py-0.5 text-xs text-muted-foreground",
        className,
      )}
    >
      [{type}: {id} not found]
    </span>
  );
}
