"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pencil, Plus } from "lucide-react";
import { TableSearchBar } from "@/components/admin/table-search-bar";
import { PaginationControls } from "@/components/admin/pagination-controls";
import { EmptyTableState } from "@/components/admin/empty-table-state";
import { cn } from "@/lib/utils";
import type { SapStockListRow } from "@/lib/db/admin";

interface SapProductsTableProps {
  items: SapStockListRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const qtyFormat = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });

export function SapProductsTable({
  items,
  total,
  page,
  pageSize,
  totalPages,
}: SapProductsTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentSearch = searchParams.get("search") ?? "";
  const [searchInput, setSearchInput] = useState(currentSearch);

  // Sync input when URL changes externally
  useEffect(() => {
    setSearchInput(currentSearch);
  }, [currentSearch]);

  const updateSearch = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set("search", value);
      else params.delete("search");
      params.delete("page");
      startTransition(() => {
        router.replace(`${pathname}?${params.toString()}`);
      });
    },
    [router, pathname, searchParams]
  );

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== currentSearch) updateSearch(searchInput);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput, currentSearch, updateSearch]);

  return (
    <div className="space-y-4">
      <TableSearchBar
        query={searchInput}
        onQueryChange={setSearchInput}
        placeholder="Search item code or name..."
      />

      <div className={cn("rounded-xl border", isPending && "opacity-60")}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[160px]">Item Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="w-24 text-right">On Hand</TableHead>
              <TableHead className="w-24 text-right">Available</TableHead>
              <TableHead className="hidden w-32 md:table-cell">Website</TableHead>
              <TableHead className="w-44 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              total === 0 && !currentSearch ? (
                <EmptyTableState
                  title="No SAP data yet"
                  description="Items appear here after the SAP B1 sync script pushes stock to /api/stock-sync"
                />
              ) : (
                <EmptyTableState
                  title="No results for your search"
                  description="Try a different item code or name"
                />
              )
            ) : (
              items.map((item) => (
                <TableRow key={item.item_code}>
                  <TableCell className="font-mono text-sm">{item.item_code}</TableCell>
                  <TableCell className="max-w-[320px] truncate">{item.item_name}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {qtyFormat.format(item.on_hand)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {qtyFormat.format(item.available)}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {item.matched ? (
                      <Badge variant="secondary">On website</Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">
                        Not on website
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {item.matched ? (
                        <>
                          <Button size="sm" variant="outline" disabled>
                            <Plus className="mr-1 h-3.5 w-3.5" />
                            Add
                          </Button>
                          <Button size="sm" variant="outline" asChild>
                            <Link href={`/admin/products/${encodeURIComponent(item.item_code)}/edit`}>
                              <Pencil className="mr-1 h-3.5 w-3.5" />
                              Edit
                            </Link>
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button size="sm" asChild>
                            <Link
                              href={`/admin/products/new?sapCode=${encodeURIComponent(item.item_code)}`}
                            >
                              <Plus className="mr-1 h-3.5 w-3.5" />
                              Add
                            </Link>
                          </Button>
                          <Button size="sm" variant="outline" disabled>
                            <Pencil className="mr-1 h-3.5 w-3.5" />
                            Edit
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <PaginationControls
        currentPage={page}
        totalPages={totalPages}
        total={total}
        pageSize={pageSize}
      />
    </div>
  );
}
