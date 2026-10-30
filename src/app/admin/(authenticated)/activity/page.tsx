import type { Metadata } from "next";
import Link from "next/link";
import { requireOwner } from "@/lib/auth";
import { adminGetActivity, adminListUsers } from "@/lib/db/admin";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PaginationControls } from "@/components/admin/pagination-controls";
import { cn } from "@/lib/utils";
import type { ActivityEntity } from "@/lib/activity";

export const metadata: Metadata = {
  title: "Activity Log",
};

const ENTITY_LABEL: Record<ActivityEntity, string> = {
  product: "Products",
  brand: "Brands",
  category: "Categories",
  service: "Services",
  page_image: "Page images",
  content: "Page text",
  company: "Company info",
  inquiry: "Inquiries",
  user: "Users",
};

const ACTION_STYLE: Record<string, string> = {
  create: "border-emerald-500 text-emerald-600",
  delete: "border-destructive text-destructive",
  bulk_delete: "border-destructive text-destructive",
};

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    timeZone: "Asia/Bangkok",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

type Props = {
  searchParams: Promise<{ page?: string; pageSize?: string; entity?: string; user?: string }>;
};

export default async function ActivityPage({ searchParams }: Props) {
  await requireOwner();
  const params = await searchParams;
  const entity = params.entity && params.entity in ENTITY_LABEL ? params.entity : undefined;
  const userEmail = params.user || undefined;
  const pageSize = [20, 50, 100].includes(Number(params.pageSize)) ? Number(params.pageSize) : 20;

  const [result, users] = await Promise.all([
    adminGetActivity({ page: Math.max(1, Number(params.page) || 1), pageSize, entity, userEmail }),
    adminListUsers(),
  ]);

  const href = (next: { entity?: string; user?: string }) => {
    const q = new URLSearchParams();
    const e = "entity" in next ? next.entity : entity;
    const u = "user" in next ? next.user : userEmail;
    if (e) q.set("entity", e);
    if (u) q.set("user", u);
    const s = q.toString();
    return s ? `/admin/activity?${s}` : "/admin/activity";
  };

  const chip = (active: boolean) =>
    cn(
      "rounded-full border px-3 py-1 text-sm transition-colors",
      active ? "border-foreground bg-foreground text-background" : "hover:bg-muted"
    );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Activity Log</h1>
        <p className="text-sm text-muted-foreground">
          Who changed what in the admin panel ({result.total.toLocaleString()} entries). Times are
          Bangkok time.
        </p>
      </div>

      <div className="space-y-3">
        <nav className="flex flex-wrap gap-2" aria-label="Filter by type">
          <Link href={href({ entity: undefined })} className={chip(!entity)}>
            All types
          </Link>
          {Object.entries(ENTITY_LABEL).map(([key, label]) => (
            <Link key={key} href={href({ entity: key })} className={chip(entity === key)}>
              {label}
            </Link>
          ))}
        </nav>
        <nav className="flex flex-wrap gap-2" aria-label="Filter by user">
          <Link href={href({ user: undefined })} className={chip(!userEmail)}>
            Everyone
          </Link>
          {users.map((u) => (
            <Link key={u.id} href={href({ user: u.email })} className={chip(userEmail === u.email)}>
              {u.email}
            </Link>
          ))}
        </nav>
      </div>

      <div className="rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[170px]">When</TableHead>
              <TableHead className="w-[220px]">Who</TableHead>
              <TableHead className="w-[130px]">Action</TableHead>
              <TableHead>What</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {result.rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-16 text-center text-sm text-muted-foreground">
                  No activity yet. Changes made in the admin panel will appear here.
                </TableCell>
              </TableRow>
            ) : (
              result.rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="text-xs text-muted-foreground">{formatTime(row.created_at)}</TableCell>
                  <TableCell className="max-w-[220px] truncate text-sm">{row.user_email ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={ACTION_STYLE[row.action]}>
                      {row.action.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    <span className="text-muted-foreground">
                      {ENTITY_LABEL[row.entity as ActivityEntity] ?? row.entity} ·{" "}
                    </span>
                    <span className="break-words">{row.summary ?? row.entity_id}</span>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <PaginationControls
        currentPage={result.page}
        totalPages={result.totalPages}
        total={result.total}
        pageSize={result.pageSize}
      />
    </div>
  );
}
