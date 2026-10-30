"use server";

import { updateTag } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { adminSaveCompanyInfo } from "@/lib/db/admin";
import { COMPANY_INFO_TAG } from "@/lib/db/company";
import { revalidateEntity } from "@/lib/revalidation";
import { companySchema } from "@/lib/validations/company";
import type { ActionState } from "./types";

export async function updateCompanyAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireAdmin();

  const validated = companySchema.safeParse(Object.fromEntries(formData));
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }
  const v = validated.data;

  try {
    await adminSaveCompanyInfo({
      name: { th: v.nameTh, en: v.nameEn },
      tagline: { th: v.taglineTh, en: v.taglineEn },
      description: { th: v.descriptionTh, en: v.descriptionEn },
      year_established: v.yearEstablished,
      phone: v.phone,
      email: v.email,
      line_id: v.lineId || null,
      address: { th: v.addressTh, en: v.addressEn },
      business_hours: { th: v.hoursTh, en: v.hoursEn },
      map_url: v.mapUrl,
      coordinates: { lat: v.lat, lng: v.lng },
      stats: {
        years: v.statYears,
        brands: v.statBrands,
        products: v.statProducts,
        clients: v.statClients,
      },
    });
  } catch (error) {
    console.error("Failed to save company info:", error);
    return { message: "Failed to save company info. Please try again." };
  }

  updateTag(COMPANY_INFO_TAG);
  revalidateEntity("/admin/company");
  await logActivity(user, { action: "update", entity: "company", summary: "Updated company info" });
  return { success: true, message: "Company info saved" };
}
