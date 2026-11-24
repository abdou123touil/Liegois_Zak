import { PackageOpen } from "lucide-react";

export function TableEmptyRow({ colSpan, title, description }: { colSpan: number; title: string; description?: string }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-5 py-8">
        <div className="flex min-h-28 flex-col items-center justify-center gap-3 text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <PackageOpen className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="font-medium text-foreground/75">{title}</span>
          {description && <span className="max-w-sm text-sm text-muted-foreground">{description}</span>}
        </div>
      </td>
    </tr>
  );
}
