import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ServiceForm } from "@/components/admin/service-form";
import { AdminBreadcrumb } from "@/components/admin/admin-breadcrumb";
import { AdminPageTitle } from "@/components/admin/admin-page-title";
import { UnsavedChangesProvider } from "@/components/admin/unsaved-changes-provider";
import { adminGetServiceBySlug } from "@/lib/db/admin";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return { title: `Edit ${slug}` };
}

export default async function EditServicePage({ params }: Props) {
  const { slug } = await params;
  const service = await adminGetServiceBySlug(slug);
  if (!service) notFound();

  return (
    <UnsavedChangesProvider>
      <div className="space-y-6">
        <div>
          <AdminBreadcrumb
            items={[{ label: "Services", href: "/admin/services" }, { label: `Edit "${service.title.en}"` }]}
          />
          <div className="mt-2">
            <AdminPageTitle title={`Edit ${service.title.en}`} description="Update the service page." />
          </div>
        </div>
        <ServiceForm service={service} />
      </div>
    </UnsavedChangesProvider>
  );
}
