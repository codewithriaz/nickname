"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import type { CategoryDTO, ProductDTO } from "@/types/dto";
import type { ProductInput, ProductOption } from "@/schemas/shop";
import type { ProductType } from "@/generated/prisma/enums";
import { Dialog } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Segmented } from "@/components/ui/segmented";
import { FileUpload, MultiImageUpload } from "@/components/common/image-upload";
import { toMajor, toMinor } from "@/lib/money";

type Draft = {
  name: string;
  description: string;
  type: ProductType;
  price: string;
  comparePrice: string;
  stock: string;
  sku: string;
  images: string[];
  options: ProductOption[];
  categoryId: string;
  affiliateUrl: string;
  digitalUrl: string;
  isActive: boolean;
  isFeatured: boolean;
};

const toDraft = (p?: ProductDTO | null): Draft => ({
  name: p?.name ?? "",
  description: p?.description ?? "",
  type: p?.type ?? "PHYSICAL",
  price: p ? String(toMajor(p.price)) : "",
  comparePrice: p?.comparePrice ? String(toMajor(p.comparePrice)) : "",
  stock: p?.stock != null ? String(p.stock) : "",
  sku: p?.sku ?? "",
  images: p?.images ?? [],
  options: p?.options ?? [],
  categoryId: p?.categoryId ?? "",
  affiliateUrl: p?.affiliateUrl ?? "",
  digitalUrl: p?.digitalUrl ?? "",
  isActive: p?.isActive ?? true,
  isFeatured: p?.isFeatured ?? false,
});

export function ProductForm({
  product,
  categories,
  onClose,
  onSubmit,
  saving,
}: {
  product?: ProductDTO | null;
  categories: CategoryDTO[];
  onClose: () => void;
  onSubmit: (input: ProductInput) => void;
  saving?: boolean;
}) {
  const [d, setD] = useState<Draft>(() => toDraft(product));
  const [error, setError] = useState<string | null>(null);
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((s) => ({ ...s, [k]: v }));

  const submit = () => {
    if (!d.name.trim()) return setError("Name is required");
    if (d.price === "" || Number(d.price) < 0) return setError("Enter a valid price");
    setError(null);
    onSubmit({
      name: d.name.trim(),
      description: d.description,
      type: d.type,
      price: toMinor(Number(d.price)),
      comparePrice: d.comparePrice ? toMinor(Number(d.comparePrice)) : null,
      stock: d.stock === "" ? null : Math.max(0, Math.floor(Number(d.stock))),
      sku: d.sku || null,
      images: d.images,
      options: d.options.filter((o) => o.name && o.values.length),
      categoryId: d.categoryId || null,
      affiliateUrl: d.type === "AFFILIATE" ? d.affiliateUrl : null,
      digitalUrl: d.type === "DIGITAL" ? d.digitalUrl || null : null,
      isActive: d.isActive,
      isFeatured: d.isFeatured,
    });
  };

  return (
    <Dialog
      open
      side="right"
      onClose={onClose}
      title={product ? "Edit product" : "Add product"}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} loading={saving}>
            {product ? "Save" : "Add product"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Segmented
          value={d.type}
          onChange={(v) => set("type", v)}
          options={[
            { value: "PHYSICAL", label: "Physical" },
            { value: "DIGITAL", label: "Digital" },
            { value: "AFFILIATE", label: "Affiliate" },
          ]}
        />
        <Field label="Photos" hint="First photo is the cover. Up to 8.">
          <MultiImageUpload value={d.images} onChange={(images) => set("images", images)} />
        </Field>
        <Field label="Product name">
          <Input value={d.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Cotton Three-Piece" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Price (৳)">
            <Input type="number" min={0} step="0.01" value={d.price} onChange={(e) => set("price", e.target.value)} />
          </Field>
          <Field label="Compare-at price (৳)" hint="Shows a strikethrough">
            <Input type="number" min={0} step="0.01" value={d.comparePrice} onChange={(e) => set("comparePrice", e.target.value)} />
          </Field>
          {d.type !== "AFFILIATE" && (
            <>
              <Field label="Stock" hint="Leave empty for unlimited">
                <Input type="number" min={0} value={d.stock} onChange={(e) => set("stock", e.target.value)} />
              </Field>
              <Field label="SKU (optional)">
                <Input value={d.sku} onChange={(e) => set("sku", e.target.value)} />
              </Field>
            </>
          )}
        </div>
        {d.type === "AFFILIATE" && (
          <Field label="Affiliate URL" hint="Buyers are sent here (Daraz, Amazon, etc.)">
            <Input value={d.affiliateUrl} onChange={(e) => set("affiliateUrl", e.target.value)} placeholder="https://" />
          </Field>
        )}
        {d.type === "DIGITAL" && (
          <Field label="Download file" hint="Unlocked on the order page after payment is confirmed">
            <Input value={d.digitalUrl} onChange={(e) => set("digitalUrl", e.target.value)} placeholder="https:// or upload" />
            <div className="pt-1">
              <FileUpload onUploaded={(r) => set("digitalUrl", r.url)} />
            </div>
          </Field>
        )}
        <Field label="Category">
          <Select value={d.categoryId} onChange={(e) => set("categoryId", e.target.value)}>
            <option value="">No category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Description">
          <Textarea rows={5} value={d.description} onChange={(e) => set("description", e.target.value)} />
        </Field>

        {d.type === "PHYSICAL" && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Variants (size, color…)</p>
            {d.options.map((o, i) => (
              <div key={i} className="flex gap-2">
                <Input value={o.name} onChange={(e) => set("options", d.options.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} placeholder="Size" className="w-28" />
                <Input
                  defaultValue={o.values.join(", ")}
                  onBlur={(e) => set("options", d.options.map((x, j) => (j === i ? { ...x, values: e.target.value.split(",").map((v) => v.trim()).filter(Boolean) } : x)))}
                  placeholder="S, M, L, XL"
                />
                <Button variant="ghost" size="icon" onClick={() => set("options", d.options.filter((_, j) => j !== i))} aria-label="Remove option">
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
            {d.options.length < 5 && (
              <Button variant="outline" size="sm" onClick={() => set("options", [...d.options, { name: "", values: [] }])}>
                <Plus className="size-4" /> Add variant
              </Button>
            )}
          </div>
        )}
        <div className="space-y-3 rounded-2xl border border-border p-3">
          <Switch label="Visible in shop" checked={d.isActive} onCheckedChange={(v) => set("isActive", v)} />
          <Switch label="Featured (shown first)" checked={d.isFeatured} onCheckedChange={(v) => set("isFeatured", v)} />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    </Dialog>
  );
}
