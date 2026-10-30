import { unstable_cache } from "next/cache";
import { createSupabaseClient } from "@/lib/supabase";
import { COMPANY } from "@/lib/constants";
import type { CompanyInfo, DbCompanyInfo } from "@/data/types";

export const COMPANY_INFO_TAG = "company-info";

/** Used only when the company_info row is missing or a field is empty. */
const FALLBACK: CompanyInfo = {
  name: { th: "บริษัท แหลมทอง ซินดิเคท จำกัด", en: "Laemthong Syndicate Co., Ltd." },
  tagline: { th: "", en: "" },
  description: { th: "", en: "" },
  yearEstablished: COMPANY.foundedYear,
  address: { th: COMPANY.address, en: COMPANY.address },
  phone: COMPANY.phone,
  email: COMPANY.email,
  mapUrl: "",
  coordinates: { lat: 0, lng: 0 },
  businessHours: { th: "", en: "" },
  stats: { ...COMPANY.stats },
};

function toCompanyInfo(row: DbCompanyInfo): CompanyInfo {
  return {
    name: row.name,
    tagline: row.tagline,
    description: row.description,
    yearEstablished: row.year_established,
    address: row.address,
    phone: row.phone,
    email: row.email,
    lineId: row.line_id ?? undefined,
    mapUrl: row.map_url,
    coordinates: row.coordinates,
    businessHours: row.business_hours ?? FALLBACK.businessHours,
    stats: { ...FALLBACK.stats, ...row.stats },
  };
}

async function fetchCompanyInfo(): Promise<CompanyInfo | null> {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from("company_info")
    .select("*")
    .single();
  if (error) return null;
  return toCompanyInfo(data as DbCompanyInfo);
}

/** Raw company_info row (null if missing). Cached; invalidated by the admin Company page. */
export const getCompanyInfo = unstable_cache(fetchCompanyInfo, ["company-info"], {
  revalidate: 3600,
  tags: [COMPANY_INFO_TAG],
});

/** Company details for rendering — always returns a value (falls back to constants). */
export async function getSiteCompany(): Promise<CompanyInfo> {
  return (await getCompanyInfo()) ?? FALLBACK;
}

/** "tel:" link for a display phone number such as "+66-2-538-4949". */
export function toTelHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}
