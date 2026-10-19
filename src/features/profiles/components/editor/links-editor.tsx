"use client";

import { useCallback, useMemo, useState } from "react";
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Layers, Plus } from "lucide-react";
import type { BlockDTO } from "@/types/dto";
import type { BlockType } from "@/generated/prisma/enums";
import { useActiveProfileId, useBlocks, useCreateBlock, useDeleteBlock, useDuplicateBlock, useReorderBlocks, useTabs, useUpdateBlock } from "../../hooks";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useConfirm } from "@/components/ui/confirm";
import { Segmented } from "@/components/ui/segmented";
import { LivePreview } from "../live-preview";
import { AddBlockDialog } from "./add-block-dialog";
import { BlockEditor } from "./block-editor";
import { SortableBlockRow } from "./block-row";
import { TabsManager } from "./tabs-manager";

const DEFAULT_TITLES: Partial<Record<BlockType, string>> = {
  LINK: "New link",
  AFFILIATE: "Affiliate pick",
  HEADER: "Section title",
  FOLDER: "More links",
  EMAIL_SIGNUP: "Join my list",
  FORM: "Contact me",
  FILE: "Download",
};

export function LinksEditor() {
  const { profileId } = useActiveProfileId();
  if (!profileId) return null;
  return <Editor profileId={profileId} />;
}

function Editor({ profileId }: { profileId: string }) {
  const { data: blocks, isLoading } = useBlocks(profileId);
  const { data: tabs = [] } = useTabs(profileId);
  const create = useCreateBlock(profileId);
  const update = useUpdateBlock(profileId);
  const remove = useDeleteBlock(profileId);
  const duplicate = useDuplicateBlock(profileId);
  const reorder = useReorderBlocks(profileId);
  const [confirmDialog, confirm] = useConfirm();
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tabFilter, setTabFilter] = useState<string>("all");

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  const topLevel = useMemo(() => (blocks ?? []).filter((b) => !b.parentId), [blocks]);
  const visibleTop = useMemo(
    () => (tabFilter === "all" ? topLevel : topLevel.filter((b) => (tabFilter === "main" ? !b.tabId : b.tabId === tabFilter))),
    [topLevel, tabFilter],
  );
  const childrenByParent = useMemo(() => {
    const map = new Map<string, BlockDTO[]>();
    for (const b of blocks ?? []) if (b.parentId) map.set(b.parentId, [...(map.get(b.parentId) ?? []), b]);
    return map;
  }, [blocks]);
  const tabTitles = useMemo(() => new Map(tabs.map((t) => [t.id, t.title])), [tabs]);
  const folders = useMemo(() => topLevel.filter((b) => b.type === "FOLDER"), [topLevel]);
  const editing = blocks?.find((b) => b.id === editingId) ?? null;

  const onDragEnd = (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return;
    const from = topLevel.findIndex((b) => b.id === e.active.id);
    const to = topLevel.findIndex((b) => b.id === e.over!.id);
    if (from < 0 || to < 0) return;
    reorder.mutate(arrayMove(topLevel, from, to));
  };

  const onPick = (type: BlockType) =>
    create.mutate(
      { type, title: DEFAULT_TITLES[type] ?? "", tabId: tabFilter !== "all" && tabFilter !== "main" ? tabFilter : null },
      {
        onSuccess: (b) => {
          setAdding(false);
          if (!["DIVIDER", "SOCIALS"].includes(type)) setEditingId(b.id);
        },
      },
    );

  // Stable callbacks so memoised rows don't re-render
  const onEdit = useCallback((b: BlockDTO) => setEditingId(b.id), []);
  const onToggle = useCallback((b: BlockDTO, isActive: boolean) => update.mutate({ id: b.id, body: { isActive } }), [update]);
  const onDuplicate = useCallback((b: BlockDTO) => duplicate.mutate(b.id), [duplicate]);
  const onDelete = useCallback(
    async (b: BlockDTO) => {
      if (await confirm({ title: "Delete this block?", description: b.type === "FOLDER" ? "Links inside the folder are deleted too." : undefined, confirmLabel: "Delete", destructive: true }))
        remove.mutate(b.id);
    },
    [confirm, remove],
  );

  return (
    <div className="grid gap-8 xl:grid-cols-[1fr_340px]">
      <div>
        <PageHeader
          title="Links & blocks"
          description="Add, arrange and style everything on your page. Drag to reorder."
          actions={
            <Button onClick={() => setAdding(true)}>
              <Plus className="size-4" /> Add block
            </Button>
          }
        />
        <Card className="mb-4 space-y-3 p-4">
          <TabsManager profileId={profileId} tabs={tabs} />
          {tabs.length > 0 && (
            <Segmented size="sm" value={tabFilter} onChange={setTabFilter} options={[{ value: "all", label: "All" }, { value: "main", label: "Home" }, ...tabs.map((t) => ({ value: t.id, label: t.title }))]} />
          )}
        </Card>

        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
        ) : visibleTop.length === 0 ? (
          <EmptyState icon={Layers} title="No blocks yet" description="Add links, products, forms, videos and more." action={<Button onClick={() => setAdding(true)}>Add your first block</Button>} />
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={visibleTop.map((b) => b.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {visibleTop.map((b) => (
                  <SortableBlockRow
                    key={b.id}
                    block={b}
                    childBlocks={childrenByParent.get(b.id)}
                    tabTitle={b.tabId ? tabTitles.get(b.tabId) : undefined}
                    onEdit={onEdit}
                    onToggle={onToggle}
                    onDuplicate={onDuplicate}
                    onDelete={onDelete}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      <aside className="hidden xl:block">
        <div className="sticky top-20">
          <LivePreview profileId={profileId} />
        </div>
      </aside>

      <AddBlockDialog open={adding} onClose={() => setAdding(false)} onPick={onPick} loading={create.isPending} />
      {editing && (
        <BlockEditor
          key={editing.id}
          block={editing}
          profileId={profileId}
          tabs={tabs}
          folders={folders.filter((f) => f.id !== editing.id)}
          onClose={() => setEditingId(null)}
          saving={update.isPending}
          onSave={(body) => update.mutate({ id: editing.id, body }, { onSuccess: () => setEditingId(null) })}
        />
      )}
      {confirmDialog}
    </div>
  );
}
