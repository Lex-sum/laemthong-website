/**
 * Reads image files for the Product Images import — runs in the browser, so large
 * ZIPs never pass through the server (Vercel limits request bodies to ~4.5 MB).
 *
 * Accepted names (slug = product slug, n = image order, 1 = main image):
 *   products/<slug>/<n>.jpg   <slug>/<n>.jpg   <slug>/image-<n>.jpg   (folders, any depth)
 *   <slug>_<n>.jpg   <slug>.jpg  (flat files; "<slug>.jpg" is image 1)
 */
export const IMAGE_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  avif: "image/avif",
};

/** Matches the `images` bucket file size limit. */
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const SLUG = /^[a-z0-9-]+$/;

export type ImageCandidate = {
  slug: string;
  order: number;
  file: File;
  /** Path as it appeared in the ZIP / folder, for messages. */
  source: string;
};

export type SkippedFile = { source: string; reason: string };

function extensionOf(name: string): string {
  return name.split(".").pop()?.toLowerCase() ?? "";
}

/** Works out slug + order from a path, or explains why it can't. */
function parsePath(path: string): { slug: string; order: number } | { reason: string } {
  const parts = path.split("/").filter(Boolean);
  const fileName = parts[parts.length - 1];
  const ext = extensionOf(fileName);
  const base = fileName.slice(0, -(ext.length + 1));

  // In a folder named after the slug: <slug>/<n>.ext or <slug>/image-<n>.ext
  if (parts.length >= 2) {
    const folder = parts[parts.length - 2].toLowerCase();
    const numbered = base.match(/^(?:image-)?(\d+)$/i);
    if (numbered && folder !== "products") {
      return SLUG.test(folder)
        ? { slug: folder, order: Number(numbered[1]) }
        : { reason: `Folder "${parts[parts.length - 2]}" is not a valid slug` };
    }
  }

  // Flat: <slug>_<n>.ext or <slug>.ext
  const flat = base.toLowerCase().match(/^([a-z0-9-]+?)(?:_(\d+))?$/);
  if (flat && SLUG.test(flat[1])) {
    return { slug: flat[1], order: flat[2] ? Number(flat[2]) : 1 };
  }

  return { reason: "Name doesn't match <slug>/<n>.jpg, <slug>_<n>.jpg or <slug>.jpg" };
}

function check(source: string, file: File, images: ImageCandidate[], skipped: SkippedFile[]) {
  const name = source.split("/").pop() ?? source;
  if (name.startsWith(".") || source.includes("__MACOSX/")) return; // OS junk, ignore silently

  const type = IMAGE_TYPES[extensionOf(name)];
  if (!type) {
    skipped.push({ source, reason: "Not a supported image (JPG, PNG, WebP, AVIF)" });
    return;
  }
  if (file.size > MAX_IMAGE_BYTES) {
    skipped.push({ source, reason: `Larger than 5 MB (${(file.size / 1024 / 1024).toFixed(1)} MB)` });
    return;
  }

  const parsed = parsePath(source);
  if ("reason" in parsed) {
    skipped.push({ source, reason: parsed.reason });
    return;
  }

  // Normalise the MIME type (ZIP entries have none)
  const typed = file.type === type ? file : new File([file], name, { type });
  images.push({ ...parsed, file: typed, source });
}

/** Collects candidate images from ZIPs and/or loose files (including folder picks). */
export async function collectImageFiles(
  inputs: File[]
): Promise<{ images: ImageCandidate[]; skipped: SkippedFile[] }> {
  const images: ImageCandidate[] = [];
  const skipped: SkippedFile[] = [];

  for (const input of inputs) {
    if (extensionOf(input.name) === "zip") {
      const { default: JSZip } = await import("jszip");
      let zip: Awaited<ReturnType<typeof JSZip.loadAsync>>;
      try {
        zip = await JSZip.loadAsync(await input.arrayBuffer());
      } catch {
        skipped.push({ source: input.name, reason: "Could not open ZIP file" });
        continue;
      }
      for (const entry of Object.values(zip.files)) {
        if (entry.dir) continue;
        const blob = await entry.async("blob");
        check(entry.name, new File([blob], entry.name.split("/").pop() ?? entry.name), images, skipped);
      }
    } else {
      // Folder picks carry the relative path; plain file picks only the name
      const source = (input as File & { webkitRelativePath?: string }).webkitRelativePath || input.name;
      check(source, input, images, skipped);
    }
  }

  images.sort((a, b) => a.slug.localeCompare(b.slug) || a.order - b.order || a.source.localeCompare(b.source));
  return { images, skipped };
}
