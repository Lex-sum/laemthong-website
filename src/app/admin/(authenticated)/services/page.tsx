import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ServicesTable } from "@/components/admin/services-table";
import { adminGetAllServices } from "@/lib/db/admin";

export const metadata: Metadata = {
  title: "Services",
};

export default async function AdminServicesPage() {
  const services = await adminGetAllServices();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Services</h1>
          <p className="text-sm text-muted-foreground">
            Services shown on the home page and Services page ({services.length}). Drag to reorder.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/services/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Service
          </Link>
        </Button>
      </div>

      <ServicesTable services={services} />
    </div>
  );
}
