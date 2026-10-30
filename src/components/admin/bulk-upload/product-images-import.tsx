"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  FileArchive,
  FolderOpen,
  ImagePlus,
  Loader2,
  RotateCcw,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  collectImageFiles,
  type ImageCandidate,
  type SkippedFile,
} from "@/lib/bulk-upload/image-files";
import {
  attachProductImagesAction,
  checkProductSlugsAction,
  createProductImageUploadsAction,
  discardUploadedImagesAction,
} from "@/app/admin/actions/product-images";
import { cn } from "@/lib/utils";
import { MAX_PRODUCT_IMAGES } from "@/lib/constants";

type Group = {
  slug: string;
  productName: string | null;
  currentCount: number;
  files: ImageCandidate[];
};

type Result = {
  slug: string;
  status: "success" | "failed" | "skipped";
  message: string;
};

type Step = "select" | "checking" | "preview" | "importing" | "results";
type Mode = "append" | "replace";

const browserStorage = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false },
  }).storage.from("images");

/**
 * Which files fit under the per-product limit. "append" fills the free slots after the
 * current images; "replace" starts from zero. The rest are reported, never dropped silently.
 */
function planGroup(group: Group, mode: Mode) {
  const capacity = mode === "append" ? Math.max(0, MAX_PRODUCT_IMAGES - group.currentCount) : MAX_PRODUCT_IMAGES;
  return { upload: group.files.slice(0, capacity), over: group.files.slice(capacity) };
}

function overLimitNote(over: ImageCandidate[]) {
  if (over.length === 0) return "";
  const names = over.map((f) => f.source.split("/").pop()).join(", ");
  return ` · ${over.length} not uploaded (over the ${MAX_PRODUCT_IMAGES}-image limit): ${names}`;
}

function extensionOf(name: string) {
  return name.split(".").pop()?.toLowerCase() ?? "jpg";
}

/** Uploads one product's images straight to storage, then attaches them. */
async function importGroup(group: Group, mode: Mode): Promise<Result> {
  const { upload, over } = planGroup(group, mode);
  if (upload.length === 0) {
    return {
      slug: group.slug,
      status: "skipped",
      message: `Already has ${group.currentCount} images (max ${MAX_PRODUCT_IMAGES}) — use Replace or remove images first`,
    };
  }

  const prepared = await createProductImageUploadsAction(
    group.slug,
    upload.map((f) => extensionOf(f.file.name))
  );
  if (!prepared.uploads) {
    return { slug: group.slug, status: "failed", message: prepared.error ?? "Could not prepare upload" };
  }

  const storage = browserStorage();
  const uploaded: string[] = [];
  for (let i = 0; i < upload.length; i++) {
    const { path, token } = prepared.uploads[i];
    const file = upload[i].file;
    const { error } = await storage.uploadToSignedUrl(path, token, file, {
      contentType: file.type,
      cacheControl: "31536000",
    });
    if (error) {
      await discardUploadedImagesAction(group.slug, uploaded);
      return { slug: group.slug, status: "failed", message: `${upload[i].source}: ${error.message}` };
    }
    uploaded.push(path);
  }

  const attached = await attachProductImagesAction(group.slug, uploaded, mode);
  if (!attached.success) {
    await discardUploadedImagesAction(group.slug, uploaded);
    return { slug: group.slug, status: "failed", message: attached.error ?? "Could not attach images" };
  }
  return {
    slug: group.slug,
    status: "success",
    message:
      (mode === "append"
        ? `Added ${attached.added} image(s)`
        : `Replaced with ${attached.added} image(s)${attached.removed ? `, deleted ${attached.removed} old file(s)` : ""}`) +
      overLimitNote(over),
  };
}

function Thumbs({ files }: { files: ImageCandidate[] }) {
  // Object URLs for previews, released when the row unmounts
  const urls = useMemo(() => files.slice(0, 4).map((f) => URL.createObjectURL(f.file)), [files]);
  useEffect(() => () => urls.forEach((u) => URL.revokeObjectURL(u)), [urls]);

  return (
    <div className="flex items-center gap-1">
      {urls.map((url, i) => (
        // eslint-disable-next-line @next/next/no-img-element -- local blob preview, not an optimisable asset
        <img key={url} src={url} alt={`${files[i].slug} #${files[i].order}`} className="h-10 w-10 rounded border object-cover" />
      ))}
      {files.length > 4 && <span className="ml-1 text-xs text-muted-foreground">+{files.length - 4}</span>}
    </div>
  );
}

export function ProductImagesImport() {
  const [step, setStep] = useState<Step>("select");
  const [groups, setGroups] = useState<Group[]>([]);
  const [skippedFiles, setSkippedFiles] = useState<SkippedFile[]>([]);
  const [mode, setMode] = useState<Mode>("append");
  const [results, setResults] = useState<Result[]>([]);
  const [progress, setProgress] = useState({ done: 0, total: 0, slug: "" });
  const [isDragging, setIsDragging] = useState(false);
  const zipInput = useRef<HTMLInputElement>(null);
  const folderInput = useRef<HTMLInputElement>(null);

  // Allow picking a whole folder (non-standard attribute, so set it imperatively)
  useEffect(() => {
    folderInput.current?.setAttribute("webkitdirectory", "");
  }, []);

  const ready = groups.filter((g) => g.productName !== null);
  const missing = groups.filter((g) => g.productName === null);
  // Memoised so thumbnail object URLs aren't recreated on every render
  const plans = useMemo(() => new Map(groups.map((g) => [g.slug, planGroup(g, mode)])), [groups, mode]);
  const readyImageCount = ready.reduce((n, g) => n + (plans.get(g.slug)?.upload.length ?? 0), 0);
  const overLimitCount = ready.reduce((n, g) => n + (plans.get(g.slug)?.over.length ?? 0), 0);

  async function handleFiles(fileList: FileList | File[] | null) {
    const files = Array.from(fileList ?? []);
    if (files.length === 0) return;
    setStep("checking");
    try {
      const { images, skipped } = await collectImageFiles(files);
      const bySlug = new Map<string, ImageCandidate[]>();
      for (const img of images) bySlug.set(img.slug, [...(bySlug.get(img.slug) ?? []), img]);

      const info = bySlug.size > 0 ? await checkProductSlugsAction([...bySlug.keys()]) : {};
      const next: Group[] = [...bySlug.entries()].map(([slug, list]) => ({
        slug,
        productName: info[slug]?.name ?? null,
        currentCount: info[slug]?.imageCount ?? 0,
        files: list,
      }));
      // Products found first, then missing ones
      next.sort((a, b) => Number(a.productName === null) - Number(b.productName === null) || a.slug.localeCompare(b.slug));

      setGroups(next);
      setSkippedFiles(skipped);
      setStep("preview");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not read the files");
      setStep("select");
    }
  }

  async function runImport(targets: Group[]) {
    setStep("importing");
    setProgress({ done: 0, total: targets.length, slug: "" });
    const out: Result[] = [];
    for (const group of targets) {
      setProgress((p) => ({ ...p, slug: group.slug }));
      try {
        out.push(await importGroup(group, mode));
      } catch (error) {
        out.push({ slug: group.slug, status: "failed", message: error instanceof Error ? error.message : "Unexpected error" });
      }
      setProgress((p) => ({ ...p, done: p.done + 1 }));
    }
    setResults((prev) => {
      // On retry, replace the earlier rows for the same slugs
      const retried = new Set(out.map((r) => r.slug));
      return [...prev.filter((r) => !retried.has(r.slug)), ...out];
    });
    setStep("results");
  }

  function startImport() {
    setResults(missing.map((g) => ({ slug: g.slug, status: "skipped", message: "Product not found — add product data first" })));
    runImport(ready);
  }

  function reset() {
    setGroups([]);
    setSkippedFiles([]);
    setResults([]);
    setStep("select");
  }

  const failed = results.filter((r) => r.status === "failed");

  return (
    <div className="max-w-6xl space-y-6 rounded-xl border bg-card p-6">
      {step === "select" && (
        <div className="space-y-6">
          <div
            className={cn(
              "rounded-lg border-2 border-dashed p-10 text-center transition-colors",
              isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25"
            )}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              handleFiles(e.dataTransfer.files);
            }}
          >
            <ImagePlus className="mx-auto mb-3 h-12 w-12 text-muted-foreground" />
            <p className="font-medium">Drop a ZIP here, or choose a ZIP or folder</p>
            <p className="mt-1 text-sm text-muted-foreground">
              One folder per product, named after its slug. Nothing is uploaded until you confirm.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <Button variant="outline" className="gap-2" onClick={() => zipInput.current?.click()}>
                <FileArchive className="h-4 w-4" /> Choose ZIP
              </Button>
              <Button variant="outline" className="gap-2" onClick={() => folderInput.current?.click()}>
                <FolderOpen className="h-4 w-4" /> Choose folder
              </Button>
            </div>
            <input ref={zipInput} type="file" accept=".zip" hidden onChange={(e) => handleFiles(e.target.files)} />
            <input ref={folderInput} type="file" multiple hidden onChange={(e) => handleFiles(e.target.files)} />
          </div>

          <div className="space-y-3 border-t pt-4 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">Folder structure</p>
            <div className="rounded border bg-muted/30 p-3 font-mono text-xs leading-relaxed whitespace-pre">
{`products/                 (optional top folder)
├── 1013010005/           ← folder name = product slug
│   ├── 1.jpg             ← numbered files first: 1 = main image
│   ├── 2.jpg
│   └── side-view.png     ← any other name works, placed after numbered ones (A–Z)
└── 1013010009/
    └── front.jpg`}
            </div>
            <ul className="ml-2 list-inside list-disc space-y-1">
              <li>Images must be inside a folder named after the product slug; loose files are skipped.</li>
              <li>The product must already exist — import Product Data first.</li>
              <li>JPG, PNG, WebP or AVIF, up to 5 MB each.</li>
              <li>
                Up to {MAX_PRODUCT_IMAGES} images per product in total. When adding to existing images, only
                the free slots are filled (in file order); the rest are listed and not uploaded.
              </li>
              <li>Files that can&apos;t be used are listed with the reason before anything is uploaded.</li>
            </ul>
          </div>
        </div>
      )}

      {step === "checking" && (
        <div className="flex items-center justify-center gap-3 py-16 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" /> Reading files and checking products…
        </div>
      )}

      {step === "preview" && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Ready to import</p>
              <p className="text-2xl font-bold text-green-600">{ready.length}</p>
              <p className="text-xs text-muted-foreground">
                {readyImageCount} images
                {overLimitCount > 0 && ` · ${overLimitCount} over the ${MAX_PRODUCT_IMAGES}-image limit`}
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Product not found</p>
              <p className="text-2xl font-bold text-red-600">{missing.length}</p>
              <p className="text-xs text-muted-foreground">Add product data first</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Files skipped</p>
              <p className="text-2xl font-bold text-yellow-600">{skippedFiles.length}</p>
              <p className="text-xs text-muted-foreground">Wrong name, type or size</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label>When a product already has images</Label>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  ["append", "Add after existing images"],
                  ["replace", "Replace existing images (old files are deleted)"],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setMode(value)}
                  className={cn(
                    "rounded-md border px-3 py-2 text-sm transition-colors",
                    mode === value ? "border-foreground bg-foreground text-background" : "hover:bg-muted"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-left font-medium">Slug</th>
                  <th className="px-4 py-3 text-left font-medium">Product</th>
                  <th className="px-4 py-3 text-left font-medium">New images</th>
                  <th className="px-4 py-3 text-right font-medium">Current</th>
                  <th className="px-4 py-3 text-right font-medium">After</th>
                </tr>
              </thead>
              <tbody>
                {groups.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                      No usable images found. Check the file names below.
                    </td>
                  </tr>
                ) : (
                  groups.map((g) => {
                    const found = g.productName !== null;
                    const plan = plans.get(g.slug)!;
                    const after = !found ? "—" : (mode === "append" ? g.currentCount : 0) + plan.upload.length;
                    return (
                      <tr key={g.slug} className="border-t">
                        <td className="px-4 py-3">
                          {!found ? (
                            <Badge variant="outline" className="border-destructive text-destructive">Not found</Badge>
                          ) : plan.upload.length === 0 ? (
                            <Badge variant="outline" className="border-yellow-600 text-yellow-700">Full</Badge>
                          ) : plan.over.length > 0 ? (
                            <Badge variant="outline" className="border-yellow-600 text-yellow-700">Partly</Badge>
                          ) : (
                            <Badge variant="outline" className="border-green-600 text-green-700">Ready</Badge>
                          )}
                        </td>
                        <td className="px-4 py-3 font-mono">{g.slug}</td>
                        <td className="max-w-[260px] truncate px-4 py-3">
                          {found ? g.productName : <span className="text-muted-foreground">Add product data first</span>}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Thumbs files={found ? plan.upload : g.files} />
                            <span className="text-xs text-muted-foreground">
                              {found ? plan.upload.length : g.files.length}
                            </span>
                          </div>
                          {found && plan.over.length > 0 && (
                            <p className="mt-1 text-xs text-yellow-700">
                              {plan.over.length} over the {MAX_PRODUCT_IMAGES}-image limit, not uploaded:{" "}
                              {plan.over.map((f) => f.source.split("/").pop()).join(", ")}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">{found ? g.currentCount : "—"}</td>
                        <td className="px-4 py-3 text-right tabular-nums">{after}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {skippedFiles.length > 0 && (
            <details className="rounded-lg border p-4 text-sm">
              <summary className="cursor-pointer font-medium">
                <AlertTriangle className="mr-1 inline h-4 w-4 text-yellow-600" />
                {skippedFiles.length} file(s) will be skipped
              </summary>
              <ul className="mt-3 max-h-64 space-y-1 overflow-y-auto">
                {skippedFiles.map((f) => (
                  <li key={f.source} className="flex gap-2">
                    <span className="font-mono text-xs">{f.source}</span>
                    <span className="text-muted-foreground">— {f.reason}</span>
                  </li>
                ))}
              </ul>
            </details>
          )}

          <div className="flex items-center justify-between gap-2 border-t pt-4">
            <Button variant="outline" onClick={reset}>
              Back
            </Button>
            <Button onClick={startImport} disabled={readyImageCount === 0}>
              Upload {readyImageCount} images to{" "}
              {ready.filter((g) => (plans.get(g.slug)?.upload.length ?? 0) > 0).length} products
            </Button>
          </div>
        </div>
      )}

      {step === "importing" && (
        <div className="space-y-4 py-6 text-center">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary" />
          <p className="text-lg font-semibold">
            Uploading… {progress.done} of {progress.total} products
          </p>
          <div className="mx-auto h-2 max-w-md overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${progress.total ? (progress.done / progress.total) * 100 : 0}%` }}
            />
          </div>
          {progress.slug && <p className="font-mono text-sm text-muted-foreground">{progress.slug}</p>}
          <p className="text-xs text-muted-foreground">Keep this tab open until it finishes.</p>
        </div>
      )}

      {step === "results" && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Succeeded</p>
              <p className="text-2xl font-bold text-green-600">{results.filter((r) => r.status === "success").length}</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Failed</p>
              <p className="text-2xl font-bold text-red-600">{failed.length}</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Skipped (no product)</p>
              <p className="text-2xl font-bold text-yellow-600">{results.filter((r) => r.status === "skipped").length}</p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Result</th>
                  <th className="px-4 py-3 text-left font-medium">Slug</th>
                  <th className="px-4 py-3 text-left font-medium">Details</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r) => (
                  <tr key={r.slug} className="border-t">
                    <td className="px-4 py-3">
                      {r.status === "success" && <CheckCircle2 className="h-5 w-5 text-green-600" />}
                      {r.status === "failed" && <XCircle className="h-5 w-5 text-red-600" />}
                      {r.status === "skipped" && <AlertTriangle className="h-5 w-5 text-yellow-600" />}
                    </td>
                    <td className="px-4 py-3 font-mono">{r.slug}</td>
                    <td className="px-4 py-3 text-muted-foreground">{r.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-4">
            <div className="flex flex-wrap gap-2">
              {failed.length > 0 && (
                <>
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={() => {
                      navigator.clipboard
                        .writeText(failed.map((r) => r.slug).join("\n"))
                        .then(() => toast.success("Failed slugs copied"))
                        .catch(() => toast.error("Could not copy"));
                    }}
                  >
                    <Copy className="h-4 w-4" /> Copy failed slugs
                  </Button>
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={() => runImport(groups.filter((g) => failed.some((r) => r.slug === g.slug)))}
                  >
                    <RotateCcw className="h-4 w-4" /> Retry failed
                  </Button>
                </>
              )}
            </div>
            <Button onClick={reset}>Upload more images</Button>
          </div>
        </div>
      )}
    </div>
  );
}
