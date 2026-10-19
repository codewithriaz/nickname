"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Crown, Plus, Trash2 } from "lucide-react";
import type { TemplateDTO } from "@/types/dto";
import type { TemplateInput } from "@/schemas/theme";
import { DEFAULT_THEME } from "@/schemas/theme";
import { adminApi } from "../api";
import { useAdminMutation } from "../hooks";
import { qk } from "@/lib/query-keys";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Input, Textarea } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useConfirm } from "@/components/ui/confirm";
import { TemplateThumb } from "@/components/common/template-thumb";
import { ThemeEditor } from "@/components/common/theme-editor";
import { slugify } from "@/lib/utils";

const blank: TemplateInput = { slug: "", name: "", description: "", category: "general", theme: DEFAULT_THEME, previewImage: null, isPremium: false, isActive: true, sortOrder: 100 };

export function TemplatesAdminView() {
  const { data: templates = [] } = useQuery({ queryKey: qk.admin.templates, queryFn: adminApi.templates });
  const [editing, setEditing] = useState<(TemplateDTO & { usage?: number }) | "new" | null>(null);
  const [confirmDialog, confirm] = useConfirm();
  const remove = useAdminMutation((id: string) => adminApi.deleteTemplate(id), "Template deleted");

  return (
    <>
      <PageHeader
        title="Templates"
        description="Design themes users can apply. New templates are instantly available in every dashboard."
        actions={
          <Button onClick={() => setEditing("new")}>
            <Plus className="size-4" /> New template
          </Button>
        }
      />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {templates.map((t) => (
          <div key={t.id} className="overflow-hidden rounded-2xl border border-border bg-white">
            <button type="button" onClick={() => setEditing(t)} className="block w-full">
              <TemplateThumb theme={t.theme} />
            </button>
            <div className="space-y-1 p-3">
              <div className="flex items-center gap-1.5">
                <p className="flex-1 truncate text-sm font-semibold">{t.name}</p>
                {t.isPremium && (
                  <Badge tone="warning">
                    <Crown className="size-3" />
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {t.usage} profiles · {t.isActive ? "active" : "hidden"}
              </p>
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive"
                onClick={async () => {
                  if (await confirm({ title: `Delete "${t.name}"?`, description: "Profiles using it fall back to the default look.", destructive: true, confirmLabel: "Delete" })) remove.mutate(t.id);
                }}
              >
                <Trash2 className="size-3.5" /> Delete
              </Button>
            </div>
          </div>
        ))}
      </div>
      {editing && <TemplateEditor template={editing === "new" ? null : editing} onClose={() => setEditing(null)} />}
      {confirmDialog}
    </>
  );
}

function TemplateEditor({ template, onClose }: { template: TemplateDTO | null; onClose: () => void }) {
  const [d, setD] = useState<TemplateInput>(() => (template ? { ...blank, ...template, previewImage: template.previewImage } : blank));
  const save = useAdminMutation((input: TemplateInput) => (template ? adminApi.updateTemplate(template.id, input) : adminApi.createTemplate(input)), "Template saved");
  const set = <K extends keyof TemplateInput>(k: K, v: TemplateInput[K]) => setD((s) => ({ ...s, [k]: v }));

  return (
    <Dialog
      open
      onClose={onClose}
      size="xl"
      title={template ? `Edit ${template.name}` : "New template"}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button loading={save.isPending} onClick={() => save.mutate({ ...d, slug: d.slug || slugify(d.name) }, { onSuccess: onClose })}>
            Save template
          </Button>
        </>
      }
    >
      <div className="grid gap-6 md:grid-cols-[1fr_220px]">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Name">
              <Input value={d.name} onChange={(e) => set("name", e.target.value)} />
            </Field>
            <Field label="Slug">
              <Input value={d.slug} onChange={(e) => set("slug", slugify(e.target.value))} placeholder="auto" />
            </Field>
            <Field label="Category">
              <Input value={d.category} onChange={(e) => set("category", e.target.value)} />
            </Field>
            <Field label="Sort order">
              <Input type="number" value={d.sortOrder} onChange={(e) => set("sortOrder", Number(e.target.value))} />
            </Field>
          </div>
          <Field label="Description">
            <Textarea rows={2} value={d.description} onChange={(e) => set("description", e.target.value)} />
          </Field>
          <div className="flex gap-6">
            <Switch label="Premium" checked={d.isPremium} onCheckedChange={(v) => set("isPremium", v)} />
            <Switch label="Active" checked={d.isActive} onCheckedChange={(v) => set("isActive", v)} />
          </div>
          <ThemeEditor theme={d.theme} onChange={(theme) => set("theme", theme)} />
        </div>
        <div className="md:sticky md:top-0">
          <div className="overflow-hidden rounded-3xl border-4 border-zinc-900">
            <TemplateThumb theme={d.theme} label={d.name || "Preview"} />
          </div>
        </div>
      </div>
    </Dialog>
  );
}
