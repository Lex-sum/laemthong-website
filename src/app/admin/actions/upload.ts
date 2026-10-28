"use server";

import { requireAdmin } from "@/lib/auth";
import { uploadImage, deleteImage, type ImageFolder } from "@/lib/storage";

export type UploadResult = {
  success: boolean;
  url?: string;
  error?: string;
};

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/svg+xml",
];

export async function uploadImageAction(
  formData: FormData
): Promise<UploadResult> {
  await requireAdmin();

  const file = formData.get("file") as File | null;
  const folder = formData.get("folder") as ImageFolder | null;
  const entitySlug = formData.get("entitySlug") as string | null;

  if (!file || !folder || !entitySlug) {
    return { success: false, error: "Missing required fields." };
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      success: false,
      error: "Invalid file type. Allowed: JPEG, PNG, WebP, AVIF, SVG.",
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    return { success: false, error: "File too large. Maximum size is 5MB." };
  }

  try {
    const url = await uploadImage(folder, entitySlug, file);
    return { success: true, url };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Upload failed.",
    };
  }
}

export async function deleteImageAction(publicUrl: string): Promise<void> {
  await requireAdmin();

  await deleteImage(publicUrl);
}
