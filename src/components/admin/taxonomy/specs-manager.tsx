"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DndContext, closestCenter } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Loader2, Pencil, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DeleteDialog } from "@/components/admin/delete-dialog";
import { EmptyTableState } from "@/components/admin/empty-table-state";
import { SortableTableRow } from "@/components/admin/sortable-table-row";
import { useSortableTable } from "@/hooks/use-sortable-table";
import { deleteSpecAction, reorderSpecsAction } from "@/app/admin/actions/taxonomy";
import { formatBucket } from "@/lib/spec-format";
import { SPEC_TYPE_LABEL, SpecDialog } from "./spec-dialog";
import type { SpecAttribute } from "@/data/types";

type Usage = { attributes: Record<string, number>; options: Record<string, number> };

function valuesSummary(spec: SpecAttribute): string {
  if (spec.type === "single" || spec.type === "multi") {
    if (spec.options.length === 0) return "No values yet";
    const shown = spec.options.slice(0, 4).map((o) => o.label.th).join(", ");
    return spec.options.length > 4 ? `${shown} +${spec.options.length - 4}` : shown;
  }
  if (spec.type === "number") {
    return spec.buckets.length > 0
      ? spec.buckets.map((b) => formatBucket(b, spec.unit, "th")).join(" · ")
      : spec.unit ? `Number (${spec.unit})` : "Number";
  }
  return spec.type === "boolean" ? "มี / ไม่มี" : "Free text";
}

function SpecCells({ spec, usage }: { spec: SpecAttribute; usage: Usage }) {
  return (
    <>
      <TableCell>
        <div className="font-medium">{spec.name.th}</div>
        <div className="text-xs text-muted-foreground">{spec.name.en}</div>
      </TableCell>
      <TableCell className="hidden font-mono text-xs text-muted-foreground md:table-cell">{spec.key}</TableCell>
      <TableCell>
        <Badge variant="outline">{SPEC_TYPE_LABEL[spec.type]}</Badge>
      </TableCell>
      <TableCell className="hidden max-w-xs truncate text-sm text-muted-foreground lg:table-cell">{valuesSummary(spec)}</TableCell>
      <TableCell className="text-center text-sm">{spec.filterable ? "✓" : "—"}</TableCell>
      <TableCell className="text-right tabular-nums">{usage.attributes[spec.id] ?? 0}</TableCell>
    </>
  );
}

const HEAD = (
  <>
    <TableHead>Spec</TableHead>
    <TableHead className="hidden md:table-cell">Key</TableHead>
    <TableHead>Type</TableHead>
    <TableHead className="hidden lg:table-cell">Values</TableHead>
    <TableHead className="w-16 text-center">Filter</TableHead>
    <TableHead className="w-20 text-right">Products</TableHead>
  </>
);

/** Specs of one category: inherited ones (read-only) and its own (editable, drag to reorder). */
export function SpecsManager({
  categorySlug,
  own,
  inherited,
  parent,
  usage,
}: {
  categorySlug: string;
  own: SpecAttribute[];
  inherited: SpecAttribute[];
  parent?: { slug: string; name: string };
  usage: Usage;
}) {
  const router = useRouter();
  const [items, setItems] = useState(own);
  const [editing, setEditing] = useState<{ spec?: SpecAttribute } | null>(null);
  useEffect(() => { setItems(own); }, [own]);

  const { sensors, handleDragEnd, isPending } = useSortableTable({
    items,
    setItems,
    reorderAction: (ids) => reorderSpecsAction(categorySlug, ids),
    getId: (item) => item.id,
    successMessage: "Specs reordered",
    errorMessage: "Failed to reorder specs",
  });

  return (
    <div className="space-y-6">
      {parent && (
        <div className="space-y-2">
          <div className="flex items-baseline justify-between gap-4">
            <h3 className="text-sm font-semibold">From the main category ({inherited.length})</h3>
            <Link href={`/admin/categories/${parent.slug}?tab=specs`} className="text-sm text-primary hover:underline">
              Edit in {parent.name} →
            </Link>
          </div>
          <div className="rounded-xl border bg-muted/30">
            <Table>
              <TableHeader>
                <TableRow>{HEAD}</TableRow>
              </TableHeader>
              <TableBody>
                {inherited.length === 0 ? (
                  <EmptyTableState title="No shared specs" description="The main category has no specs yet" />
                ) : (
                  inherited.map((spec) => (
                    <TableRow key={spec.id}>
                      <SpecCells spec={spec} usage={usage} />
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-sm font-semibold">
            {parent ? `Only in this sub category (${items.length})` : `Specs (${items.length}) — shared by all sub categories`}
          </h3>
          <Button size="sm" onClick={() => setEditing({})}>
            <Plus className="mr-1 h-4 w-4" />
            Add spec
          </Button>
        </div>
        <div className="rounded-xl border">
          <DndContext id={`specs-${categorySlug}`} sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10" />
                  {HEAD}
                  <TableHead className="w-24 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 ? (
                  <EmptyTableState title="No specs yet" description="Add the specs customers compare and filter by" />
                ) : (
                  <SortableContext items={items.map((s) => s.id)} strategy={verticalListSortingStrategy}>
                    {items.map((spec) => {
                      const used = usage.attributes[spec.id] ?? 0;
                      return (
                        <SortableTableRow key={spec.id} id={spec.id} disabled={isPending}>
                          <SpecCells spec={spec} usage={usage} />
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              {isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                              ) : (
                                <>
                                  <Button variant="ghost" size="icon" aria-label="Edit" onClick={() => setEditing({ spec })}>
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <DeleteDialog
                                    title={`Delete spec "${spec.name.th}"?`}
                                    description={
                                      used > 0
                                        ? `${used} products have a value for this spec — those values are deleted too. This can't be undone.`
                                        : "This can't be undone."
                                    }
                                    onDelete={async () => {
                                      const result = await deleteSpecAction(spec.id, categorySlug);
                                      if (result.success) router.refresh();
                                      return result;
                                    }}
                                  />
                                </>
                              )}
                            </div>
                          </TableCell>
                        </SortableTableRow>
                      );
                    })}
                  </SortableContext>
                )}
              </TableBody>
            </Table>
          </DndContext>
        </div>
      </div>

      <SpecDialog
        open={!!editing}
        onOpenChange={(open) => !open && setEditing(null)}
        categorySlug={categorySlug}
        spec={editing?.spec}
        usage={usage}
        onSaved={() => router.refresh()}
      />
    </div>
  );
}
