import { Warehouse } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatQty } from "@/lib/format";
import type { SapProductInfo } from "@/lib/db/admin";

function formatSyncTime(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    timeZone: "Asia/Bangkok",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Read-only SAP B1 stock for the product's slug, plus SAP items sharing the same name. */
export function SapStockPanel({ info }: { info: SapProductInfo }) {
  const { match, sameName } = info;
  const rows = match ? [match, ...sameName] : [];
  const totalOnHand = rows.reduce((sum, r) => sum + r.on_hand, 0);
  const totalAvailable = rows.reduce((sum, r) => sum + r.available, 0);

  return (
    <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Warehouse className="h-4 w-4 text-muted-foreground" />
          SAP B1
        </div>
        {match && (
          <span className="text-xs text-muted-foreground">
            Last synced {formatSyncTime(match.synced_at)}
          </span>
        )}
      </div>

      {match ? (
        <>
          <p className="text-sm">
            <span className="text-muted-foreground">Name: </span>
            <span className="font-medium">{match.item_name}</span>
          </p>
          <div className="rounded-md border bg-background">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item Code</TableHead>
                  <TableHead className="w-28 text-right">On Hand</TableHead>
                  <TableHead className="w-28 text-right">Available</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.item_code}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm">{row.item_code}</span>
                        {row.item_code === match.item_code ? (
                          <Badge variant="secondary">Slug</Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">
                            Same name
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatQty(row.on_hand)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatQty(row.available)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              {rows.length > 1 && (
                <TableFooter>
                  <TableRow>
                    <TableCell className="font-semibold">Total ({rows.length} codes)</TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">
                      {formatQty(totalOnHand)}
                    </TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">
                      {formatQty(totalAvailable)}
                    </TableCell>
                  </TableRow>
                </TableFooter>
              )}
            </Table>
          </div>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">
          No data from SAP B1 — no SAP item code matches this slug.
        </p>
      )}

      <p className="text-xs text-muted-foreground">
        Matched by slug when this page was opened — editing the slug above doesn&apos;t refresh it.
      </p>
    </div>
  );
}
