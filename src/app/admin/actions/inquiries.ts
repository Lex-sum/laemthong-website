"use server";

import { requireAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { adminDeleteContactInquiry } from "@/lib/db/admin";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function deleteInquiryAction(id: string): Promise<{ success: boolean; message?: string }> {
  await requireAdmin();

  if (!UUID_REGEX.test(id)) {
    return { success: false, message: "Invalid inquiry ID." };
  }

  try {
    await adminDeleteContactInquiry(id);
  } catch {
    return { success: false, message: "Failed to delete inquiry." };
  }

  revalidatePath("/admin/inquiries");
  revalidatePath("/admin");
  return { success: true };
}
