"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DndContext, closestCenter } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { ExternalLink, Loader2, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TableThumbnail } from "@/components/admin/table-thumbnail";
import { DeleteDialog } from "@/components/admin/delete-dialog";
import { EmptyTableState } from "@/components/admin/empty-table-state";
import { SortableTableRow } from "./sortable-table-row";
import { useSortableTable } from "@/hooks/use-sortable-table";
import { deleteServiceAction } from "@/app/admin/actions/services";
import { reorderServices } from "@/app/admin/actions/reorder";
import type { DbService } from "@/data/types";

export function ServicesTable({ services }: { services: DbService[] }) {
  const [items, setItems] = useState(services);
  useEffect(() => { setItems(services); }, [services]);

  const { sensors, handleDragEnd, isPending } = useSortableTable({
    items,
    setItems,
    reorderAction: (slugs) => reorderServices(slugs),
    getId: (item) => item.slug,
    successMessage: "Services reordered — the website uses the new order",
    errorMessage: "Failed to reorder services",
    disabled: false,
  });

  return (
    <div className="rounded-xl border">
      <DndContext id="services-table" sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10" />
              <TableHead className="w-12" />
              <TableHead>Service</TableHead>
              <TableHead className="hidden md:table-cell">Slug</TableHead>
              <TableHead className="w-32 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <EmptyTableState
                title="No services yet"
                description="Add a service to show it on the website"
                action={{ label: "Add Service", href: "/admin/services/new" }}
              />
            ) : (
              <SortableContext items={items.map((s) => s.slug)} strategy={verticalListSortingStrategy}>
                {items.map((service) => (
                  <SortableTableRow key={service.slug} id={service.slug} disabled={isPending}>
                    <TableCell>
                      <TableThumbnail src={service.image_url ?? undefined} alt={service.title.en} />
                    </TableCell>
                    <TableCell className="max-w-[320px]">
                      <div className="flex items-center gap-2">
                        <span className="truncate font-medium">{service.title.en}</span>
                        {service.is_primary && <Badge variant="secondary">Core</Badge>}
                      </div>
                      <div className="truncate text-xs text-muted-foreground">{service.title.th}</div>
                    </TableCell>
                    <TableCell className="hidden font-mono text-sm text-muted-foreground md:table-cell">
                      {service.slug}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        ) : (
                          <>
                            <Button variant="ghost" size="icon" asChild aria-label="View on website">
                              <a href={`/th/services/${service.slug}`} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </Button>
                            <Button variant="ghost" size="icon" asChild aria-label="Edit">
                              <Link href={`/admin/services/${service.slug}/edit`}>
                                <Pencil className="h-4 w-4" />
                              </Link>
                            </Button>
                            <DeleteDialog
                              title={`Delete "${service.title.en}"?`}
                              description="The service page will be removed from the website. This can't be undone."
                              onDelete={deleteServiceAction.bind(null, service.slug)}
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
  );
}
