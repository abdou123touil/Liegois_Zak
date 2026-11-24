import { Skeleton } from "@/components/ui/skeleton";

export function TableLoadingRow({ colSpan, label }: { colSpan: number; label: string }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-5 py-6">
        <div role="status" aria-label={label} className="space-y-3">
          <span className="sr-only">{label}</span>
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-[92%]" />
          <Skeleton className="h-3 w-4/5" />
        </div>
      </td>
    </tr>
  );
}
