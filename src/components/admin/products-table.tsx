"use client";

import { useState, useEffect, useMemo, useCallback, useTransition } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pencil, Trash2, Loader2, X } from "lucide-react";
import { TableThumbnail } from "@/components/admin/table-thumbnail";
import { DeleteDialog } from "@/components/admin/delete-dialog";
import { ProductsTableToolbar } from "@/components/admin/products-table-toolbar";
import { PaginationControls } from "@/components/admin/pagination-controls";
import { EmptyTableState } from "@/components/admin/empty-table-state";
import {
  deleteProductAction,
  bulkDeleteProductsAction,
} from "@/app/admin/actions/products";
import { reorderProducts } from "@/app/admin/actions/reorder";
import { DndContext, closestCenter } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { SortableTableRow } from "./sortable-table-row";
import { useSortableTable } from "@/hooks/use-sortable-table";
import { useScrolled } from "@/hooks/use-scrolled";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { MAX_PRODUCT_IMAGES } from "@/lib/constants";
import { hasEnglish } from "@/lib/product-locale";
import type { DbProduct } from "@/data/types";

interface ProductsTableProps {
  products: DbProduct[];
  /** Slugs on this page that match a SAP B1 item code. */
  sapSlugs?: string[];
  brandEntries: [string, string][];
  categoryEntries: [string, string][];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export function ProductsTable({
  products,
  sapSlugs = [],
  brandEntries,
  categoryEntries,
  total,
  page,
  pageSize,
  totalPages,
}: ProductsTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isNavigating, startNavTransition] = useTransition();

  const [selectedSlugs, setSelectedSlugs] = useState<Set<string>>(new Set());
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const isScrolled = useScrolled();

  const [items, setItems] = useState(products);

  // Update local items when products prop changes
  useEffect(() => { setItems(products); }, [products]);

  const brandMap = useMemo(() => new Map(brandEntries), [brandEntries]);
  const sapSet = useMemo(() => new Set(sapSlugs), [sapSlugs]);
  const categoryMap = useMemo(
    () => new Map(categoryEntries),
    [categoryEntries]
  );

  // Check if any filters are active - disable drag while filtering
  const isFiltering = !!(
    searchParams.get("search") ||
    searchParams.get("category") ||
    searchParams.get("brand") ||
    searchParams.get("overImageLimit") ||
    searchParams.get("sap") ||
    searchParams.get("lang")
  );
  const canReorder = !isFiltering;

  const { sensors, handleDragEnd, isPending: isReordering } = useSortableTable({
    items,
    setItems,
    reorderAction: (slugs) => reorderProducts(slugs),
    getId: (item) => item.slug,
    successMessage: "Products reordered successfully",
    errorMessage: "Failed to reorder products",
    disabled: !canReorder,
  });

  const isPending = isReordering || isNavigating;

  const clearAllFilters = useCallback(() => {
    const params = new URLSearchParams();
    params.set("page", "1");
    startNavTransition(() => {
      router.replace(`${pathname}?${params.toString()}`);
    });
  }, [router, pathname]);

  const allPageSelected =
    products.length > 0 &&
    products.every((p) => selectedSlugs.has(p.slug));

  const toggleSelectAll = () => {
    if (allPageSelected) {
      const newSet = new Set(selectedSlugs);
      for (const p of products) newSet.delete(p.slug);
      setSelectedSlugs(newSet);
    } else {
      const newSet = new Set(selectedSlugs);
      for (const p of products) newSet.add(p.slug);
      setSelectedSlugs(newSet);
    }
  };

  const toggleSelect = (slug: string) => {
    const newSet = new Set(selectedSlugs);
    if (newSet.has(slug)) {
      newSet.delete(slug);
    } else {
      newSet.add(slug);
    }
    setSelectedSlugs(newSet);
  };

  const handleBulkDelete = async () => {
    setIsDeleting(true);
    const slugs = Array.from(selectedSlugs);
    const result = await bulkDeleteProductsAction(slugs);
    setIsDeleting(false);
    setShowDeleteDialog(false);

    if (result.message) {
      toast.error(result.message);
    } else {
      toast.success(`Deleted ${result.deleted} product(s)`);
      setSelectedSlugs(new Set());
    }
  };

  return (
    <div className="space-y-4">
      {/* Toolbar: Search + Filters */}
      <div className="flex items-center gap-4">
        <ProductsTableToolbar
          brandEntries={brandEntries}
          categoryEntries={categoryEntries}
        />
      </div>

      {/* Bulk Actions Bar */}
      {selectedSlugs.size > 0 && (
        <div className="flex items-center gap-2 rounded-lg border bg-muted/50 px-4 py-2">
          <span className="text-sm font-medium">
            {selectedSlugs.size} selected
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedSlugs(new Set())}
          >
            <X className="mr-1 h-3 w-3" />
            Deselect
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="mr-1 h-3 w-3" />
            Delete {selectedSlugs.size}
          </Button>
        </div>
      )}

      <div className="rounded-xl border">
        <DndContext
          id="products-table"
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <Table>
            <TableHeader
              className={cn(
                "sticky top-0 z-10 bg-background",
                isScrolled && "border-b-2 border-primary"
              )}
            >
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox
                    checked={allPageSelected && items.length > 0}
                    onCheckedChange={toggleSelectAll}
                    aria-label="Select all"
                  />
                </TableHead>
                <TableHead className="w-10"></TableHead>
                <TableHead className="w-12"></TableHead>
                <TableHead>Name (EN)</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Brand</TableHead>
                <TableHead className="w-24 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                total === 0 ? (
                  <EmptyTableState
                    title="No products yet"
                    description="Add your first product to get started"
                    action={{ label: "Add Product", href: "/admin/products/new" }}
                  />
                ) : (
                  <EmptyTableState
                    title={`No results for your search`}
                    description="Try adjusting your filters or search term"
                  />
                )
              ) : (
                <SortableContext
                  items={items.map((p) => p.slug)}
                  strategy={verticalListSortingStrategy}
                >
                  {items.map((product) => (
                    <SortableTableRow
                      key={product.slug}
                      id={product.slug}
                      disabled={!canReorder || isPending}
                    >
                      <TableCell>
                        <Checkbox
                          checked={selectedSlugs.has(product.slug)}
                          onCheckedChange={() => toggleSelect(product.slug)}
                          aria-label={`Select ${product.name.en || product.name.th}`}
                        />
                      </TableCell>
                      <TableCell>
                        <TableThumbnail
                          src={product.images[0]}
                          alt={product.name.en || product.name.th}
                        />
                      </TableCell>
                      <TableCell className="max-w-[200px]">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-medium truncate">{product.name.en || product.name.th}</span>
                          {!hasEnglish(product) && (
                            <span
                              className="shrink-0 rounded border px-1.5 text-xs text-muted-foreground"
                              title="No English name / short description yet — the English site shows Thai and hides this page from Google"
                            >
                              TH only
                            </span>
                          )}
                          <span className="text-xs text-muted-foreground tabular-nums shrink-0">
                            #{product.sort_order}
                          </span>
                          {sapSet.has(product.slug) && (
                            <span
                              className="shrink-0 rounded border border-emerald-600/50 px-1.5 text-xs text-emerald-700 dark:text-emerald-300"
                              title="Slug matches a SAP B1 item code"
                            >
                              SAP
                            </span>
                          )}
                          {product.images.length > MAX_PRODUCT_IMAGES && (
                            <span
                              className="shrink-0 rounded border border-amber-500/60 px-1.5 text-xs text-amber-700 dark:text-amber-300"
                              title={`More than the ${MAX_PRODUCT_IMAGES}-image limit`}
                            >
                              {product.images.length}/{MAX_PRODUCT_IMAGES} images
                            </span>
                          )}
                          {product.featured && (
                            <span className="inline-flex items-center gap-1 text-xs text-primary shrink-0">
                              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                              Featured
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[140px]">
                        <Badge variant="secondary" className="truncate max-w-full">
                          {categoryMap.get(product.category_slug) ??
                            product.category_slug}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground max-w-[140px] truncate">
                        {brandMap.get(product.brand_slug) ?? product.brand_slug}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                          ) : (
                            <>
                              <Button variant="ghost" size="icon" asChild>
                                <Link href={`/admin/products/${product.slug}/edit`}>
                                  <Pencil className="h-4 w-4" />
                                </Link>
                              </Button>
                              <DeleteDialog
                                title={`Delete "${product.name.en || product.name.th}"?`}
                                description="This action cannot be undone."
                                onDelete={deleteProductAction.bind(null, product.slug)}
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

      {!canReorder && items.length > 0 && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Drag to reorder is disabled while filtering.</span>
          <Button
            variant="link"
            size="sm"
            onClick={clearAllFilters}
            className="h-auto p-0 text-sm underline"
          >
            Clear all filters
          </Button>
          <span>to enable drag and drop.</span>
        </div>
      )}

      {/* Pagination */}
      <PaginationControls
        currentPage={page}
        totalPages={totalPages}
        total={total}
        pageSize={pageSize}
      />

      {/* Bulk Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {selectedSlugs.size} products?</DialogTitle>
            <DialogDescription>
              This will permanently delete {selectedSlugs.size} product(s) and
              all their images. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleBulkDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Delete {selectedSlugs.size} Products
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
