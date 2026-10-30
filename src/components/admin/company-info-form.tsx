"use client";

import { useActionState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { FormErrorAlert } from "./form-error-alert";
import { BilingualInput } from "./bilingual-input";
import { BilingualTextarea } from "./bilingual-textarea";
import { updateCompanyAction } from "@/app/admin/actions/company";
import type { ActionState } from "@/app/admin/actions/types";
import type { CompanyStats, DbCompanyInfo } from "@/data/types";

const STAT_FIELDS: { name: string; key: keyof CompanyStats; label: string }[] = [
  { name: "statYears", key: "years", label: "Years of experience" },
  { name: "statBrands", key: "brands", label: "Brands" },
  { name: "statProducts", key: "products", label: "Products" },
  { name: "statClients", key: "clients", label: "Clients" },
];

function Section({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4 rounded-xl border bg-card p-6">
      <div>
        <h2 className="font-semibold">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
    </section>
  );
}

function Field({
  label,
  name,
  defaultValue,
  error,
  type = "text",
  placeholder,
}: {
  label: string;
  name: string;
  defaultValue?: string | number;
  error?: string;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} type={type} defaultValue={defaultValue} placeholder={placeholder} step="any" />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

export function CompanyInfoForm({ company }: { company: DbCompanyInfo | null }) {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(updateCompanyAction, {});
  const e = state.errors;

  useEffect(() => {
    if (state.success) toast.success("Company info saved — the website is updated");
  }, [state]);

  return (
    <form action={formAction} className="max-w-4xl space-y-6">
      <FormErrorAlert message={state.success ? undefined : state.message} errors={e} />

      <Section title="Company" description="Name and description used in the footer, SEO and structured data.">
        <BilingualInput
          label="Company name"
          nameTh="nameTh"
          nameEn="nameEn"
          defaultValueTh={company?.name.th}
          defaultValueEn={company?.name.en}
          required
          errorTh={e?.nameTh?.[0]}
          errorEn={e?.nameEn?.[0]}
        />
        <BilingualInput
          label="Tagline"
          nameTh="taglineTh"
          nameEn="taglineEn"
          defaultValueTh={company?.tagline.th}
          defaultValueEn={company?.tagline.en}
        />
        <BilingualTextarea
          label="Description"
          nameTh="descriptionTh"
          nameEn="descriptionEn"
          defaultValueTh={company?.description.th}
          defaultValueEn={company?.description.en}
          rows={3}
        />
        <div className="max-w-xs">
          <Field
            label="Year established"
            name="yearEstablished"
            type="number"
            defaultValue={company?.year_established}
            error={e?.yearEstablished?.[0]}
          />
          <p className="mt-1 text-xs text-muted-foreground">Shown as &quot;Since …&quot; on the home page.</p>
        </div>
      </Section>

      <Section title="Contact" description="Shown in the footer, contact page and call-to-action boxes on every page.">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Phone" name="phone" defaultValue={company?.phone} error={e?.phone?.[0]} placeholder="+66-2-538-4949" />
          <Field label="Email" name="email" type="email" defaultValue={company?.email} error={e?.email?.[0]} />
          <Field label="LINE ID" name="lineId" defaultValue={company?.line_id ?? ""} placeholder="@laemthong" />
        </div>
        <BilingualTextarea
          label="Address"
          nameTh="addressTh"
          nameEn="addressEn"
          defaultValueTh={company?.address.th}
          defaultValueEn={company?.address.en}
          required
          rows={2}
          errorTh={e?.addressTh?.[0]}
          errorEn={e?.addressEn?.[0]}
        />
        <BilingualInput
          label="Business hours"
          nameTh="hoursTh"
          nameEn="hoursEn"
          defaultValueTh={company?.business_hours?.th}
          defaultValueEn={company?.business_hours?.en}
        />
      </Section>

      <Section title="Map" description="Paste a Google Maps embed link, or leave it empty to use the coordinates.">
        <Field label="Google Maps embed URL" name="mapUrl" type="url" defaultValue={company?.map_url} error={e?.mapUrl?.[0]} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Latitude" name="lat" type="number" defaultValue={company?.coordinates?.lat ?? 0} error={e?.lat?.[0]} />
          <Field label="Longitude" name="lng" type="number" defaultValue={company?.coordinates?.lng ?? 0} error={e?.lng?.[0]} />
        </div>
      </Section>

      <Section title="Stats" description="Numbers in the home page hero and the About page (shown with a “+”).">
        <div className="grid gap-4 sm:grid-cols-4">
          {STAT_FIELDS.map((f) => (
            <Field
              key={f.name}
              label={f.label}
              name={f.name}
              type="number"
              defaultValue={company?.stats?.[f.key] ?? 0}
              error={e?.[f.name]?.[0]}
            />
          ))}
        </div>
      </Section>

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save company info
        </Button>
      </div>
    </form>
  );
}
