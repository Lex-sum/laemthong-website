/**
 * Reads image files for the Product Images import — runs in the browser, so large
 * ZIPs never pass through the server (Vercel limits request bodies to ~4.5 MB).
 *
 * Images must sit in a folder named after the product slug (one folder per product,
 * any depth, e.g. 1013010005/front.jpg or products/1013010005/1.jpg). File names are free:
 * numbered names (1, 2, image-3) come first in number order — 1 is the main image —
 * then other names in alphabetical order.
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
  /** Number from a numbered file name; non-numbered names sort after, by name. */
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
  if (parts.length < 2) {
    return { reason: "Not in a product folder — put it in a folder named after the slug, e.g. 1013010005/1.jpg" };
  }

  const folderName = parts[parts.length - 2];
  const folder = folderName.toLowerCase();
  if (folder === "products") {
    return { reason: "Directly inside \"products\" — put it in a folder named after the slug" };
  }
  if (!SLUG.test(folder)) {
    return { reason: `Folder "${folderName}" is not a valid slug (letters, numbers and dashes only)` };
  }

  const fileName = parts[parts.length - 1];
  const base = fileName.slice(0, fileName.lastIndexOf("."));
  const numbered = base.match(/^(?:image-?)?(\d+)$/i);
  return { slug: folder, order: numbered ? Number(numbered[1]) : Number.MAX_SAFE_INTEGER };
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

/** Collects candidate images from ZIPs and folder picks. */
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

  images.sort(
    (a, b) =>
      a.slug.localeCompare(b.slug) ||
      a.order - b.order ||
      a.source.localeCompare(b.source, undefined, { numeric: true, sensitivity: "base" })
  );
  return { images, skipped };
}
