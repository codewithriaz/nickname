"use client";

import { useSyncExternalStore } from "react";
import { flexRender, getCoreRowModel, useReactTable, type ColumnDef } from "@tanstack/react-table";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { PageMeta } from "@/lib/api/types";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import { Skeleton } from "./skeleton";

type DataTableProps<T> = {
  columns: ColumnDef<T, unknown>[];
  data: T[];
  meta?: PageMeta;
  loading?: boolean;
  onPageChange?: (page: number) => void;
  emptyText?: string;
  getRowId?: (row: T) => string;
  onRowClick?: (row: T) => void;
};

const noopSubscribe = () => () => {};

/**
 * Server-paginated table built on TanStack Table (manualPagination).
 * Pass `meta` from the API and handle `onPageChange`.
 * Rendered only in the browser: TanStack Table reads `Date.now()` during render, which Next 16 forbids in prerendered shells.
 */
export function DataTable<T>(props: DataTableProps<T>) {
  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false);
  if (!mounted) return <TableSkeleton cols={props.columns.length} />;
  return <DataTableInner {...props} />;
}

function TableSkeleton({ cols }: { cols: number }) {
  return (
    <div className="space-y-2 rounded-2xl border border-border bg-white p-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="grid gap-3" style={{ gridTemplateColumns: `repeat(${Math.max(cols, 1)}, minmax(0, 1fr))` }}>
          {Array.from({ length: cols }).map((__, j) => (
            <Skeleton key={j} className="h-4" />
          ))}
        </div>
      ))}
    </div>
  );
}

function DataTableInner<T>({
  columns,
  data,
  meta,
  loading,
  onPageChange,
  emptyText = "No records found",
  getRowId,
  onRowClick,
}: DataTableProps<T>) {
  // eslint-disable-next-line react-hooks/incompatible-library -- TanStack Table returns non-memoizable functions by design
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: meta?.totalPages ?? 1,
    getRowId,
  });

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-white">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((h) => (
                  <th key={h.id} className="whitespace-nowrap px-4 py-3 font-medium">
                    {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-border">
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {columns.map((_c, j) => (
                      <td key={j} className="px-4 py-3">
                        <Skeleton className="h-4 w-full" />
                      </td>
                    ))}
                  </tr>
                ))
              : table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className={cn("hover:bg-muted/40", onRowClick && "cursor-pointer")}
                    onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="whitespace-nowrap px-4 py-3 align-middle">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
            {!loading && data.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-4 py-10 text-center text-muted-foreground">
                  {emptyText}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-border px-4 py-2.5 text-xs text-muted-foreground">
          <span>
            Page {meta.page} of {meta.totalPages} · {meta.total} total
          </span>
          <div className="flex gap-1">
            <Button variant="outline" size="icon-sm" disabled={meta.page <= 1} onClick={() => onPageChange?.(meta.page - 1)} aria-label="Previous page">
              <ChevronLeft className="size-4" />
            </Button>
            <Button variant="outline" size="icon-sm" disabled={meta.page >= meta.totalPages} onClick={() => onPageChange?.(meta.page + 1)} aria-label="Next page">
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
