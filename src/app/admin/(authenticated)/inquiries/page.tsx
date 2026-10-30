import type { Metadata } from "next";
import Link from "next/link";
import {
  adminGetContactInquiries,
  adminGetContactInquiryCount,
  adminGetInquiryStatusCounts,
} from "@/lib/db/admin";
import { InquiriesTable } from "@/components/admin/inquiries-table";
import { INQUIRY_STATUSES, INQUIRY_STATUS_LABEL, isInquiryStatus } from "@/lib/inquiry-status";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Inquiries",
};

type Props = {
  searchParams: Promise<{ page?: string; status?: string }>;
};

export default async function InquiriesPage({ searchParams }: Props) {
  const { page: pageParam, status: statusParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const status = isInquiryStatus(statusParam) ? statusParam : undefined;

  const [result, counts, allCount] = await Promise.all([
    adminGetContactInquiries(page, 20, status),
    adminGetInquiryStatusCounts(),
    adminGetContactInquiryCount(),
  ]);

  const tabs = [
    { label: "All", href: "/admin/inquiries", active: !status, count: allCount },
    ...INQUIRY_STATUSES.map((s) => ({
      label: INQUIRY_STATUS_LABEL[s],
      href: `/admin/inquiries?status=${s}`,
      active: status === s,
      count: counts[s],
    })),
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Inquiries</h1>
        <p className="text-sm text-muted-foreground">
          Contact form submissions ({result.total}). Open one to set its status and add a note.
        </p>
      </div>

      <nav className="flex flex-wrap gap-2" aria-label="Filter by status">
        {tabs.map((tab) => (
          <Link
            key={tab.label}
            href={tab.href}
            className={cn(
              "rounded-full border px-3 py-1 text-sm transition-colors",
              tab.active ? "border-foreground bg-foreground text-background" : "hover:bg-muted"
            )}
          >
            {tab.label}
            <span className="ml-1.5 tabular-nums opacity-70">{tab.count}</span>
          </Link>
        ))}
      </nav>

      <InquiriesTable
        inquiries={result.inquiries}
        currentPage={result.page}
        totalPages={result.totalPages}
        statusFilter={status}
      />
    </div>
  );
}
