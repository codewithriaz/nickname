"use client";

import { useMemo, useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { Download, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { useActiveProfileId } from "@/features/profiles/hooks";
import { profilesApi } from "@/features/profiles/api";
import { useFeature } from "@/features/auth/hooks";
import { qk } from "@/lib/query-keys";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { Button, buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { fromNow } from "@/lib/dayjs";
import type { SubscriberDTO } from "@/types/dto";
import type { ApiError } from "@/lib/api/types";
import { useDebounced } from "@/lib/hooks/use-debounced";

export function AudienceView() {
  const { profileId } = useActiveProfileId();
  const qc = useQueryClient();
  const canExport = useFeature("leadExport");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const q = useDebounced(search, 300);
  const params = { page, search: q };
  const { data, isLoading } = useQuery({
    queryKey: qk.subscribers(profileId ?? "", params),
    queryFn: () => profilesApi.subscribers(profileId!, { ...params, pageSize: 20 }),
    enabled: !!profileId,
    placeholderData: keepPreviousData,
  });
  const del = useMutation<unknown, ApiError, string>({
    mutationFn: profilesApi.deleteSubscriber,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["profiles", profileId, "subscribers"] }),
    onError: (e) => toast.error(e.message),
  });

  const columns = useMemo<ColumnDef<SubscriberDTO, unknown>[]>(
    () => [
      { header: "Email", accessorKey: "email", cell: ({ getValue }) => getValue<string>() ?? "—" },
      { header: "Name", accessorKey: "name", cell: ({ getValue }) => getValue<string>() ?? "—" },
      { header: "Phone", accessorKey: "phone", cell: ({ getValue }) => getValue<string>() ?? "—" },
      {
        header: "Form data",
        accessorKey: "data",
        cell: ({ getValue }) => {
          const d = getValue<Record<string, string> | null>();
          return d ? <span className="text-xs text-muted-foreground">{Object.entries(d).map(([k, v]) => `${k}: ${v}`).join(" · ").slice(0, 80)}</span> : "—";
        },
      },
      { header: "Joined", accessorKey: "createdAt", cell: ({ getValue }) => fromNow(getValue<string>()) },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <Button variant="ghost" size="icon-sm" onClick={() => del.mutate(row.original.id)} aria-label="Delete">
            <Trash2 className="size-4 text-destructive" />
          </Button>
        ),
      },
    ],
    [del],
  );

  return (
    <>
      <PageHeader
        title="Audience"
        description="Subscribers and form submissions from your page."
        actions={
          profileId &&
          (canExport ? (
            <a href={profilesApi.subscribersExportUrl(profileId)} className={buttonVariants({ variant: "outline" })}>
              <Download className="size-4" /> Export CSV
            </a>
          ) : (
            <Button variant="outline" disabled title="Available on paid plans">
              <Download className="size-4" /> Export CSV (Starter+)
            </Button>
          ))
        }
      />
      <Input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search email, name or phone…" className="mb-4 max-w-sm" />
      {!isLoading && data?.items.length === 0 && !q ? (
        <EmptyState icon={Users} title="No subscribers yet" description="Add an Email signup or Custom form block to start collecting leads." />
      ) : (
        <DataTable columns={columns} data={data?.items ?? []} meta={data?.meta} loading={isLoading} onPageChange={setPage} getRowId={(r) => r.id} />
      )}
    </>
  );
}
