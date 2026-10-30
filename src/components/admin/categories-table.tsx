"use client";

import { useEffect, useState } from "react";
import { DndContext, closestCenter } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Loader2, Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DeleteDialog } from "@/components/admin/delete-dialog";
import { EmptyTableState } from "@/components/admin/empty-table-state";
import { SortableTableRow } from "./sortable-table-row";
import { useSortableTable } from "@/hooks/use-sortable-table";
import {
  createCategoryAction,
  deleteCategoryAction,
  updateCategoryAction,
} from "@/app/admin/actions/categories";
import { reorderCategories } from "@/app/admin/actions/reorder";
import { slugify } from "@/lib/utils";
import type { DbCategory } from "@/data/types";

export interface CategoryWithCount extends DbCategory {
  productCount: number;
}

type Editing = { mode: "create" } | { mode: "edit"; category: CategoryWithCount };

function CategoryDialog({ editing, onClose }: { editing: Editing | null; onClose: () => void }) {
  const category = editing?.mode === "edit" ? editing.category : undefined;
  return (
    <Dialog open={!!editing} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        {editing && <CategoryForm key={category?.slug ?? "new"} category={category} onClose={onClose} />}
      </DialogContent>
    </Dialog>
  );
}

function CategoryForm({ category, onClose }: { category?: CategoryWithCount; onClose: () => void }) {
  const [nameTh, setNameTh] = useState(category?.name.th ?? "");
  const [nameEn, setNameEn] = useState(category?.name.en ?? "");
  const [slug, setSlug] = useState(category?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(!!category);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [isPending, setIsPending] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const fd = new FormData();
    fd.set("nameTh", nameTh);
    fd.set("nameEn", nameEn);
    fd.set("slug", slug || slugify(nameEn));
    fd.set("_skipRedirect", "true");
    if (category) {
      fd.set("originalSlug", category.slug);
      fd.set("sortOrder", String(category.sort_order));
    }
    setIsPending(true);
    const result = category ? await updateCategoryAction({}, fd) : await createCategoryAction({}, fd);
    setIsPending(false);
    if (result.success) {
      toast.success(category ? "Category updated" : "Category created");
      onClose();
    } else {
      setErrors(result.errors ?? {});
      if (result.message) toast.error(result.message);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <DialogHeader>
        <DialogTitle>{category ? "Edit category" : "Add category"}</DialogTitle>
        <DialogDescription>Shown as a product filter and in the footer.</DialogDescription>
      </DialogHeader>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="cat-th">Name (TH)</Label>
          <Input id="cat-th" value={nameTh} onChange={(e) => setNameTh(e.target.value)} required />
          {errors.nameTh && <p className="text-xs text-destructive">{errors.nameTh[0]}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cat-en">Name (EN)</Label>
          <Input
            id="cat-en"
            value={nameEn}
            onChange={(e) => {
              setNameEn(e.target.value);
              if (!slugTouched) setSlug(slugify(e.target.value));
            }}
            required
          />
          {errors.nameEn && <p className="text-xs text-destructive">{errors.nameEn[0]}</p>}
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="cat-slug">Slug</Label>
        <Input
          id="cat-slug"
          value={slug}
          onChange={(e) => {
            setSlug(e.target.value);
            setSlugTouched(true);
          }}
          placeholder="auto-generated-from-english-name"
        />
        {category && slug !== category.slug && (
          <p className="text-xs text-amber-600">Products in this category move with it; old filter links stop working.</p>
        )}
        {errors.slug && <p className="text-xs text-destructive">{errors.slug[0]}</p>}
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {category ? "Save" : "Create"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function CategoriesTable({ categories }: { categories: CategoryWithCount[] }) {
  const [items, setItems] = useState(categories);
  const [editing, setEditing] = useState<Editing | null>(null);
  useEffect(() => { setItems(categories); }, [categories]);

  const { sensors, handleDragEnd, isPending } = useSortableTable({
    items,
    setItems,
    reorderAction: (slugs) => reorderCategories(slugs),
    getId: (item) => item.slug,
    successMessage: "Categories reordered",
    errorMessage: "Failed to reorder categories",
    disabled: false,
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setEditing({ mode: "create" })}>
          <Plus className="mr-2 h-4 w-4" />
          Add Category
        </Button>
      </div>

      <div className="rounded-xl border">
        <DndContext id="categories-table" sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10" />
                <TableHead>Name (EN)</TableHead>
                <TableHead>Name (TH)</TableHead>
                <TableHead className="hidden md:table-cell">Slug</TableHead>
                <TableHead className="w-24 text-right">Products</TableHead>
                <TableHead className="w-24 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <EmptyTableState title="No categories yet" description="Add a category to group products" />
              ) : (
                <SortableContext items={items.map((c) => c.slug)} strategy={verticalListSortingStrategy}>
                  {items.map((category) => (
                    <SortableTableRow key={category.slug} id={category.slug} disabled={isPending}>
                      <TableCell className="font-medium">{category.name.en}</TableCell>
                      <TableCell>{category.name.th}</TableCell>
                      <TableCell className="hidden font-mono text-sm text-muted-foreground md:table-cell">
                        {category.slug}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{category.productCount}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                          ) : (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                aria-label="Edit"
                                onClick={() => setEditing({ mode: "edit", category })}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <DeleteDialog
                                title={`Delete "${category.name.en}"?`}
                                description={
                                  category.productCount > 0
                                    ? `${category.productCount} products use this category — move them to another category first.`
                                    : "This can't be undone."
                                }
                                onDelete={deleteCategoryAction.bind(null, category.slug)}
                              />
                            </>
                          )}
                        </div>
                      </TableCell>
                    </SortableTableRow>
                  ))}
                </SortableContext>
              )}
            </TableBody>
          </Table>
        </DndContext>
      </div>

      <CategoryDialog editing={editing} onClose={() => setEditing(null)} />
    </div>
  );
}
