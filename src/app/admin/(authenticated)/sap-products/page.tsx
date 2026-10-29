import type { Metadata } from "next";
import { adminGetSapStock } from "@/lib/db/admin";
import { SapProductsTable } from "@/components/admin/sap-products-table";

export const metadata: Metadata = {
  title: "Products in SAP B1",
};

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

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

export default async function SapProductsPage({ searchParams }: Props) {
  const params = await searchParams;

  const ALLOWED_PAGE_SIZES = [20, 50, 100];
  const rawPageSize = params.pageSize ? Number(params.pageSize) : 20;
  const pageSize = ALLOWED_PAGE_SIZES.includes(rawPageSize) ? rawPageSize : 20;

  const result = await adminGetSapStock({
    page: Math.max(1, Number(params.page) || 1),
    pageSize,
    search: typeof params.search === "string" ? params.search : undefined,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Products in SAP B1</h1>
        <p className="text-sm text-muted-foreground">
          Items and stock pushed from SAP Business One ({result.total.toLocaleString()})
          {result.lastSyncedAt && (
            <> · Last synced {formatSyncTime(result.lastSyncedAt)}</>
          )}
        </p>
      </div>

      <SapProductsTable
        items={result.items}
        total={result.total}
        page={result.page}
        pageSize={result.pageSize}
        totalPages={result.totalPages}
      />
    </div>
  );
}
