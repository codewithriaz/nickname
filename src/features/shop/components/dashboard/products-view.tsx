"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ExternalLink, ImagePlus, Package, Pencil, Plus, ShoppingBag, Tag, Trash2, X } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { ImageUpload } from "@/components/common/image-upload";
import type { ProductDTO } from "@/types/dto";
import { useActiveProfileId, useProfile } from "@/features/profiles/hooks";
import { useCategories, useCategoryMutations, useProductMutations, useProducts, useStore } from "../../hooks";
import { PageHeader } from "@/components/ui/page-header";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { PageLoader, Skeleton } from "@/components/ui/skeleton";
import { useConfirm } from "@/components/ui/confirm";
import { formatMoney } from "@/lib/money";
import { routes } from "@/config/site";
import { ProductForm } from "./product-form";

export function ProductsView() {
  const { profileId } = useActiveProfileId();
  const { data: store, isLoading } = useStore(profileId);
  if (isLoading) return <PageLoader />;
  if (!store)
    return (
      <EmptyState
        icon={ShoppingBag}
        title="Set up your shop first"
        description="Add your shop name, delivery charges and payment methods."
        action={
          <Link href="/dashboard/shop" className={buttonVariants({})}>
            Create shop
          </Link>
        }
      />
    );
  return <Products storeId={store.id} currency={store.currency} profileId={profileId!} />;
}

function Products({ storeId, currency, profileId }: { storeId: string; currency: string; profileId: string }) {
  const { data: profile } = useProfile(profileId);
  const { data: products, isLoading } = useProducts(storeId);
  const { data: categories = [] } = useCategories(storeId);
  const { create, update, remove } = useProductMutations(storeId);
  const cats = useCategoryMutations(storeId);
  const [confirmDialog, confirm] = useConfirm();
  const [editing, setEditing] = useState<ProductDTO | "new" | null>(null);
  const [search, setSearch] = useState("");
  const [newCat, setNewCat] = useState("");
  const [catImageFor, setCatImageFor] = useState<string | null>(null);
  const catForImage = categories.find((c) => c.id === catImageFor);

  const filtered = useMemo(() => (products ?? []).filter((p) => p.name.toLowerCase().includes(search.toLowerCase())), [products, search]);

  return (
    <>
      <PageHeader
        title="Products"
        description={`${products?.length ?? 0} products`}
        actions={
          <>
            {profile && (
              <a href={routes.shop(profile.username)} target="_blank" rel="noopener" className={buttonVariants({ variant: "outline" })}>
                View shop <ExternalLink className="size-4" />
              </a>
            )}
            <Button onClick={() => setEditing("new")}>
              <Plus className="size-4" /> Add product
            </Button>
          </>
        }
      />
      <Card className="mb-4 flex flex-wrap items-center gap-2 p-3">
        <Tag className="size-4 text-muted-foreground" />
        {categories.map((c) => (
          <span key={c.id} className="inline-flex items-center gap-1.5 rounded-full bg-muted py-1 pl-1 pr-2.5 text-xs font-medium">
            <button type="button" onClick={() => setCatImageFor(c.id)} className="size-6 overflow-hidden rounded-full bg-white ring-1 ring-border" title="Category picture">
              {c.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={c.imageUrl} alt="" className="size-full object-cover" />
              ) : (
                <ImagePlus className="m-auto size-3.5 text-muted-foreground" />
              )}
            </button>
            {c.name} <span className="text-muted-foreground">({c.productCount})</span>
            <button type="button" onClick={() => cats.remove.mutate(c.id)} aria-label={`Delete ${c.name}`}>
              <X className="size-3" />
            </button>
          </span>
        ))}
        <form
          className="flex gap-1"
          onSubmit={(e) => {
            e.preventDefault();
            if (newCat.trim()) cats.create.mutate(newCat.trim(), { onSuccess: () => setNewCat("") });
          }}
        >
          <Input value={newCat} onChange={(e) => setNewCat(e.target.value)} placeholder="New category" className="h-8 w-36 text-xs" />
          <Button type="submit" size="icon-sm" variant="outline" aria-label="Add category">
            <Plus className="size-4" />
          </Button>
        </form>
      </Card>
      <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products…" className="mb-4 max-w-sm" />

      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[3/4]" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Package} title="No products yet" description="Add photos, price and stock — it takes a minute." action={<Button onClick={() => setEditing("new")}>Add product</Button>} />
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
          {filtered.map((p) => (
            <Card key={p.id} className="overflow-hidden">
              <button type="button" className="relative block aspect-square w-full bg-muted" onClick={() => setEditing(p)}>
                {p.images[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.images[0]} alt={p.name} className="size-full object-cover" />
                ) : (
                  <Package className="absolute inset-0 m-auto size-8 text-muted-foreground" />
                )}
                <div className="absolute left-2 top-2 flex gap-1">
                  {!p.isActive && <Badge tone="dark">Hidden</Badge>}
                  {p.isFeatured && <Badge tone="primary">Featured</Badge>}
                  {p.type !== "PHYSICAL" && <Badge tone="warning">{p.type.toLowerCase()}</Badge>}
                </div>
              </button>
              <div className="space-y-1 p-3">
                <p className="truncate text-sm font-semibold">{p.name}</p>
                <p className="text-sm">
                  {formatMoney(p.price, currency)}
                  {p.comparePrice ? <s className="ml-1.5 text-xs text-muted-foreground">{formatMoney(p.comparePrice, currency)}</s> : null}
                </p>
                <p className="text-xs text-muted-foreground">{p.stock == null ? "Unlimited stock" : p.stock === 0 ? "Out of stock" : `${p.stock} in stock`}</p>
                <div className="flex gap-1 pt-1">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => setEditing(p)}>
                    <Pencil className="size-3.5" /> Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={async () => {
                      if (await confirm({ title: `Delete "${p.name}"?`, confirmLabel: "Delete", destructive: true })) remove.mutate(p.id);
                    }}
                    aria-label="Delete"
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {editing && (
        <ProductForm
          product={editing === "new" ? null : editing}
          categories={categories}
          onClose={() => setEditing(null)}
          saving={create.isPending || update.isPending}
          onSubmit={(input) =>
            editing === "new"
              ? create.mutate(input, { onSuccess: () => setEditing(null) })
              : update.mutate({ id: editing.id, body: input }, { onSuccess: () => setEditing(null) })
          }
        />
      )}
      {catForImage && (
        <Dialog open onClose={() => setCatImageFor(null)} title={`Picture for "${catForImage.name}"`} description="Shown in the Mega store category carousel" size="sm">
          <ImageUpload
            value={catForImage.imageUrl}
            onChange={(imageUrl) => cats.update.mutate({ id: catForImage.id, imageUrl }, { onSuccess: () => setCatImageFor(null) })}
          />
        </Dialog>
      )}
      {confirmDialog}
    </>
  );
}
