"use server";

import { requireAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import {
  adminUpsertPageImage,
  adminDeletePageImage,
} from "@/lib/db/admin";
import { deleteImageFolder } from "@/lib/storage";

export async function upsertPageImageAction(
  key: string,
  imageUrl: string
): Promise<{ success: boolean; message?: string }> {
  await requireAdmin();

  try {
    await adminUpsertPageImage(key, imageUrl);
  } catch (error) {
    console.error("Failed to save page image:", error);
    return { success: false, message: "Failed to save image. Please try again." };
  }

  revalidatePath("/", "layout");
  if (key === "site-favicon") {
    revalidatePath("/api/favicon");
  }
  return { success: true };
}

export async function deletePageImageAction(
  key: string
): Promise<{ success: boolean; message?: string }> {
  await requireAdmin();

  try {
    await adminDeletePageImage(key);
    deleteImageFolder("pages", key).catch(() => {});
  } catch (error) {
    console.error("Failed to delete page image:", error);
    return { success: false, message: "Failed to delete image. Please try again." };
  }

  revalidatePath("/", "layout");
  if (key === "site-favicon") {
    revalidatePath("/api/favicon");
  }
  return { success: true };
}
