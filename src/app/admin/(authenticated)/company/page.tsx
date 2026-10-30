import type { Metadata } from "next";
import { adminGetCompanyInfo } from "@/lib/db/admin";
import { CompanyInfoForm } from "@/components/admin/company-info-form";

export const metadata: Metadata = {
  title: "Company Info",
};

export default async function CompanyInfoPage() {
  const company = await adminGetCompanyInfo();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Company Info</h1>
        <p className="text-sm text-muted-foreground">
          One place for contact details and company facts — every page on the website uses these
          values.
        </p>
      </div>

      <CompanyInfoForm company={company} />
    </div>
  );
}
