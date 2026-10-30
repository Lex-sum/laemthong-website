import type { Metadata } from "next";
import { ServiceForm } from "@/components/admin/service-form";
import { AdminBreadcrumb } from "@/components/admin/admin-breadcrumb";
import { AdminPageTitle } from "@/components/admin/admin-page-title";
import { UnsavedChangesProvider } from "@/components/admin/unsaved-changes-provider";

export const metadata: Metadata = {
  title: "New Service",
};

export default function NewServicePage() {
  return (
    <UnsavedChangesProvider>
      <div className="space-y-6">
        <div>
          <AdminBreadcrumb items={[{ label: "Services", href: "/admin/services" }, { label: "New Service" }]} />
          <div className="mt-2">
            <AdminPageTitle title="New Service" description="Add a service page to the website." />
          </div>
        </div>
        <ServiceForm />
      </div>
    </UnsavedChangesProvider>
  );
}
