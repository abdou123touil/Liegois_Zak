import { PackageOpen, type LucideIcon } from "lucide-react";

export function EmptyState({
  title,
  description,
  icon: Icon = PackageOpen,
  action,
}: {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-52 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-card/70 px-6 py-10 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <p className="font-semibold text-foreground/80">{title}</p>
      {description && <p className="max-w-sm text-sm leading-6 text-muted-foreground">{description}</p>}
      {action}
    </div>
  );
}
