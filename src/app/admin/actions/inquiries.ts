"use server";

import { requireAdmin } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { revalidatePath } from "next/cache";
import { adminDeleteContactInquiry, adminUpdateInquiry } from "@/lib/db/admin";
import { INQUIRY_STATUS_LABEL, isInquiryStatus, type InquiryStatus } from "@/lib/inquiry-status";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function deleteInquiryAction(id: string): Promise<{ success: boolean; message?: string }> {
  const user = await requireAdmin();

  if (!UUID_REGEX.test(id)) {
    return { success: false, message: "Invalid inquiry ID." };
  }

  try {
    await adminDeleteContactInquiry(id);
  } catch {
    return { success: false, message: "Failed to delete inquiry." };
  }

  revalidatePath("/admin/inquiries");
  await logActivity(user, { action: "delete", entity: "inquiry", entityId: id, summary: "Deleted inquiry" });
  revalidatePath("/admin");
  return { success: true };
}

export async function updateInquiryAction(
  id: string,
  status: InquiryStatus,
  note: string
): Promise<{ success: boolean; message?: string }> {
  const user = await requireAdmin();

  if (!UUID_REGEX.test(id) || !isInquiryStatus(status)) {
    return { success: false, message: "Invalid input." };
  }
  if (note.length > 5000) {
    return { success: false, message: "Note is too long." };
  }

  try {
    await adminUpdateInquiry(id, { status, note: note.trim() || null });
  } catch {
    return { success: false, message: "Failed to update inquiry. Has the latest migration been run?" };
  }

  revalidatePath("/admin/inquiries");
  revalidatePath("/admin", "layout");
  await logActivity(user, {
    action: "update",
    entity: "inquiry",
    entityId: id,
    summary: `Marked inquiry as ${INQUIRY_STATUS_LABEL[status]}`,
  });
  return { success: true };
}
