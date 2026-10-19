"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { Check, ExternalLink, X } from "lucide-react";
import type { VerificationStatus } from "@/generated/prisma/enums";
import { adminApi, type AdminProfileRow } from "../api";
import { useAdminList, useAdminMutation } from "../hooks";
import { qk } from "@/lib/query-keys";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Segmented } from "@/components/ui/segmented";
import { formatDate } from "@/lib/dayjs";
import { compactNumber } from "@/lib/utils";
import { useDebounced } from "@/lib/hooks/use-debounced";

export function ProfilesAdminView() {
  const initial = (useSearchParams().get("verification") as VerificationStatus | null) ?? "";
  const [verification, setVerification] = useState<string>(initial);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const q = useDebounced(search);
  const { data, isLoading } = useAdminList(qk.admin.profiles, adminApi.profiles, { page, search: q, verification: verification || undefined });
  const update = useAdminMutation(({ id, body }: { id: string; body: { verification?: VerificationStatus; isPublished?: boolean } }) => adminApi.updateProfile(id, body), "Profile updated");

  const columns = useMemo<ColumnDef<AdminProfileRow, unknown>[]>(
    () => [
      {
        header: "Profile",
        accessorKey: "username",
        cell: ({ row }) => (
          <a href={`/${row.original.username}`} target="_blank" rel="noopener" className="flex items-center gap-1 font-semibold text-primary">
            @{row.original.username} <ExternalLink className="size-3" />
            <span className="block text-xs font-normal text-muted-foreground">{row.original.displayName}</span>
          </a>
        ),
      },
      { header: "Owner", accessorKey: "ownerEmail" },
      { header: "Blocks", accessorKey: "blocks" },
      { header: "Events", accessorKey: "events", cell: ({ getValue }) => compactNumber(getValue<number>()) },
      { header: "Shop", accessorKey: "hasStore", cell: ({ getValue }) => (getValue<boolean>() ? <Badge tone="primary">yes</Badge> : "—") },
      { header: "Domain", accessorKey: "customDomain", cell: ({ getValue }) => <span className="text-xs">{getValue<string>() ?? "—"}</span> },
      {
        header: "Published",
        accessorKey: "isPublished",
        cell: ({ row }) => <Switch checked={row.original.isPublished} onCheckedChange={(isPublished) => update.mutate({ id: row.original.id, body: { isPublished } })} />,
      },
      {
        header: "Verification",
        accessorKey: "verification",
        cell: ({ row }) =>
          row.original.verification === "PENDING" ? (
            <div className="flex gap-1">
              <Button size="icon-sm" variant="secondary" onClick={() => update.mutate({ id: row.original.id, body: { verification: "APPROVED" } })} aria-label="Approve">
                <Check className="size-4" />
              </Button>
              <Button size="icon-sm" variant="outline" onClick={() => update.mutate({ id: row.original.id, body: { verification: "REJECTED" } })} aria-label="Reject">
                <X className="size-4" />
              </Button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => update.mutate({ id: row.original.id, body: { verification: row.original.verification === "APPROVED" ? "NONE" : "APPROVED" } })}
              title="Toggle verified"
            >
              <Badge tone={row.original.verification === "APPROVED" ? "success" : "default"}>{row.original.verification.toLowerCase()}</Badge>
            </button>
          ),
      },
      { header: "Created", accessorKey: "createdAt", cell: ({ getValue }) => formatDate(getValue<string>()) },
    ],
    [update],
  );

  return (
    <>
      <PageHeader title="Profiles & verification" description="Moderate pages and approve verified badges." />
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Segmented
          size="sm"
          value={verification}
          onChange={(v) => { setVerification(v); setPage(1); }}
          options={[{ value: "", label: "All" }, { value: "PENDING", label: "Pending" }, { value: "APPROVED", label: "Verified" }, { value: "REJECTED", label: "Rejected" }]}
        />
        <Input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Username, name or email…" className="max-w-xs" />
      </div>
      <DataTable columns={columns} data={data?.items ?? []} meta={data?.meta} loading={isLoading} onPageChange={setPage} getRowId={(r) => r.id} />
    </>
  );
}
