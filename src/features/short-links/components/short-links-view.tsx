"use client";

import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { BarChart3, Lock, Pencil, Plus, QrCode, Scissors, Trash2 } from "lucide-react";
import type { ShortLinkDTO } from "@/types/dto";
import { useShortLinkAnalytics, useShortLinkMutations, useShortLinks } from "../hooks";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { CopyButton } from "@/components/ui/copy-button";
import { Dialog } from "@/components/ui/dialog";
import { Segmented } from "@/components/ui/segmented";
import { EmptyState } from "@/components/ui/empty-state";
import { StatCard } from "@/components/ui/stat-card";
import { useConfirm } from "@/components/ui/confirm";
import { QrCodeView } from "@/components/common/qr-code";
import { TimeSeriesChart } from "@/components/charts/time-series-chart";
import { BarList } from "@/components/charts/bar-list";
import { UpgradeHint } from "@/components/common/upgrade-hint";
import { useDebounced } from "@/lib/hooks/use-debounced";
import { compactNumber, hostnameOf } from "@/lib/utils";
import { formatDate } from "@/lib/dayjs";
import { ShortLinkForm } from "./short-link-form";

function AnalyticsDialog({ link, onClose }: { link: ShortLinkDTO; onClose: () => void }) {
  const [days, setDays] = useState(30);
  const { data } = useShortLinkAnalytics(link.id, days);
  return (
    <Dialog open onClose={onClose} title={`/s/${link.code}`} description={link.destination} size="xl">
      <div className="space-y-4">
        <Segmented value={String(days)} onChange={(v) => setDays(Number(v))} options={[7, 30, 90, 365].map((d) => ({ value: String(d), label: `${d}d` }))} />
        <div className="grid grid-cols-3 gap-3">
          <StatCard label="Clicks" value={compactNumber(data?.totals.clicks ?? 0)} />
          <StatCard label="QR scans" value={compactNumber(data?.totals.qrScans ?? 0)} />
          <StatCard label="All time" value={compactNumber(data?.totals.allTime ?? link.clicks)} />
        </div>
        {data && <TimeSeriesChart data={data.timeseries} series={[{ key: "clicks", label: "Clicks" }, { key: "qrScans", label: "QR scans" }]} height={220} />}
        {data &&
          (data.advanced ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="mb-2 text-sm font-semibold">Referrers</p>
                <BarList items={data.referrers} />
              </div>
              <div>
                <p className="mb-2 text-sm font-semibold">Countries</p>
                <BarList items={data.countries} />
              </div>
              <div>
                <p className="mb-2 text-sm font-semibold">Devices</p>
                <BarList items={data.devices} />
              </div>
              <div>
                <p className="mb-2 text-sm font-semibold">Browsers</p>
                <BarList items={data.browsers} />
              </div>
            </div>
          ) : (
            <UpgradeHint text="Referrers, countries and browsers are available on Starter & Pro." />
          ))}
      </div>
    </Dialog>
  );
}

export function ShortLinksView() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const q = useDebounced(search);
  const { data, isLoading } = useShortLinks({ page, search: q });
  const { create, update, remove } = useShortLinkMutations();
  const [confirmDialog, confirm] = useConfirm();
  const [editing, setEditing] = useState<ShortLinkDTO | "new" | null>(null);
  const [qrFor, setQrFor] = useState<ShortLinkDTO | null>(null);
  const [statsFor, setStatsFor] = useState<ShortLinkDTO | null>(null);

  const columns = useMemo<ColumnDef<ShortLinkDTO, unknown>[]>(
    () => [
      {
        header: "Short link",
        id: "short",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <span className="font-semibold text-primary">/s/{row.original.code}</span>
            {row.original.hasPassword && <Lock className="size-3.5 text-muted-foreground" />}
            <CopyButton value={row.original.shortUrl} size="icon-sm" />
          </div>
        ),
      },
      {
        header: "Destination",
        accessorKey: "destination",
        cell: ({ row }) => (
          <span className="block max-w-64 truncate text-muted-foreground" title={row.original.destination}>
            {row.original.title || hostnameOf(row.original.destination) || row.original.destination}
          </span>
        ),
      },
      { header: "Clicks", accessorKey: "clicks", cell: ({ getValue }) => <b className="tabular-nums">{compactNumber(getValue<number>())}</b> },
      {
        header: "Status",
        id: "status",
        cell: ({ row }) =>
          row.original.expiresAt && new Date(row.original.expiresAt) < new Date() ? (
            <Badge tone="danger">expired</Badge>
          ) : (
            <Switch checked={row.original.isActive} onCheckedChange={(isActive) => update.mutate({ id: row.original.id, body: { isActive } })} />
          ),
      },
      { header: "Created", accessorKey: "createdAt", cell: ({ getValue }) => formatDate(getValue<string>()) },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex gap-0.5">
            <Button variant="ghost" size="icon-sm" onClick={() => setStatsFor(row.original)} aria-label="Analytics">
              <BarChart3 className="size-4" />
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={() => setQrFor(row.original)} aria-label="QR code">
              <QrCode className="size-4" />
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={() => setEditing(row.original)} aria-label="Edit">
              <Pencil className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={async () => {
                if (await confirm({ title: "Delete short link?", description: "The link and QR code will stop working.", destructive: true, confirmLabel: "Delete" })) remove.mutate(row.original.id);
              }}
              aria-label="Delete"
            >
              <Trash2 className="size-4 text-destructive" />
            </Button>
          </div>
        ),
      },
    ],
    [update, remove, confirm],
  );

  return (
    <>
      <PageHeader
        title="Short links"
        description="Branded short links with QR codes and click analytics — perfect for Facebook posts and Marketplace listings."
        actions={
          <Button onClick={() => setEditing("new")}>
            <Plus className="size-4" /> New short link
          </Button>
        }
      />
      <Input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search…" className="mb-4 max-w-sm" />
      {!isLoading && !q && data?.items.length === 0 ? (
        <EmptyState icon={Scissors} title="No short links yet" description="Shorten any URL, track clicks and print a QR code." action={<Button onClick={() => setEditing("new")}>Create short link</Button>} />
      ) : (
        <DataTable columns={columns} data={data?.items ?? []} meta={data?.meta} loading={isLoading} onPageChange={setPage} getRowId={(r) => r.id} />
      )}
      {editing && (
        <ShortLinkForm
          link={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          saving={create.isPending || update.isPending}
          onSubmit={(v) => (editing === "new" ? create.mutate(v, { onSuccess: () => setEditing(null) }) : update.mutate({ id: editing.id, body: v }, { onSuccess: () => setEditing(null) }))}
        />
      )}
      {qrFor && (
        <Dialog open onClose={() => setQrFor(null)} title="QR code" description="Scans are tracked separately from clicks." size="sm">
          <QrCodeView value={`${qrFor.shortUrl}?qr=1`} fg={qrFor.qrStyle?.fg} bg={qrFor.qrStyle?.bg} logoUrl={qrFor.qrStyle?.logoUrl} fileName={`qr-${qrFor.code}`} size={240} />
        </Dialog>
      )}
      {statsFor && <AnalyticsDialog link={statsFor} onClose={() => setStatsFor(null)} />}
      {confirmDialog}
    </>
  );
}
