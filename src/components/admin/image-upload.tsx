"use client";

import { useState, useCallback, useRef, useMemo } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import {
  uploadImageAction,
  deleteImageAction,
} from "@/app/admin/actions/upload";
import { ImageCropDialog } from "@/components/admin/image-crop-dialog";
import { SortableImageItem } from "@/components/admin/sortable-image-item";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, Upload, X, ImagePlus } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { ImageFolder } from "@/lib/storage";

const MAX_DIMENSIONS: Record<ImageFolder, number> = {
  brands: 512,
  products: 1200,
  categories: 1200,
  pages: 1600,
  services: 1200,
};

interface ImageUploadProps {
  value: string | string[];
  onChange: (value: string | string[]) => void;
  folder: ImageFolder;
  entitySlug: string;
  multiple?: boolean;
  label?: string;
  maxFiles?: number;
  aspectRatio?: number;
  aspectRatioLabel?: string;
  recommendedPx?: string;
  maxPreviewWidth?: number;
  onUploadStateChange?: (isUploading: boolean) => void;
  reorderable?: boolean;
  showPrimaryBadge?: boolean;
}

export function ImageUpload({
  value,
  onChange,
  folder,
  entitySlug,
  multiple = false,
  label,
  maxFiles = 10,
  aspectRatio = 4 / 3,
  aspectRatioLabel,
  recommendedPx,
  maxPreviewWidth,
  onUploadStateChange,
  reorderable = false,
  showPrimaryBadge = false,
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Crop dialog state
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [cropQueue, setCropQueue] = useState<File[]>([]);

  // Centralized upload state setter
  const setUploadingState = useCallback((state: boolean) => {
    setIsUploading(state);
    onUploadStateChange?.(state);
  }, [onUploadStateChange]);

  const urls = useMemo<string[]>(
    () => (Array.isArray(value) ? value.filter(Boolean) : value ? [value] : []),
    [value]
  );

  const canUpload = !!entitySlug;
  const atLimit = multiple && urls.length >= maxFiles;

  const uploadFile = useCallback(
    async (file: File | Blob, originalName?: string) => {
      const formData = new FormData();
      if (file instanceof Blob && !(file instanceof File)) {
        formData.append(
          "file",
          new File([file], originalName ?? "cropped.webp", {
            type: file.type || "image/webp",
          })
        );
      } else {
        formData.append("file", file);
      }
      formData.append("folder", folder);
      formData.append("entitySlug", entitySlug);

      const result = await uploadImageAction(formData);
      if (!result.success) {
        toast.error(result.error ?? "Upload failed");
        return null;
      }
      return result.url!;
    },
    [folder, entitySlug]
  );

  const uploadAndUpdate = useCallback(
    async (blob: Blob) => {
      setUploadingState(true);
      try {
        const url = await uploadFile(blob);
        if (!url) return;

        if (multiple) {
          onChange([...urls, url]);
        } else {
          if (urls[0]) {
            deleteImageAction(urls[0]).catch(() => {});
          }
          onChange(url);
        }
      } catch {
        toast.error("Upload failed. Please try again.");
      } finally {
        setUploadingState(false);
      }
    },
    [multiple, urls, onChange, uploadFile, setUploadingState]
  );

  const processNextInQueue = useCallback(
    (queue: File[]) => {
      if (queue.length === 0) {
        setCropQueue([]);
        setCropSrc(null);
        return;
      }
      const [next, ...rest] = queue;
      setCropQueue(rest);
      const objectUrl = URL.createObjectURL(next);
      setCropSrc(objectUrl);
    },
    []
  );

  const handleCrop = useCallback(
    async (blob: Blob) => {
      // Clean up object URL
      if (cropSrc) URL.revokeObjectURL(cropSrc);
      setCropSrc(null);

      await uploadAndUpdate(blob);

      // Process remaining queue
      processNextInQueue(cropQueue);
    },
    [cropSrc, cropQueue, uploadAndUpdate, processNextInQueue]
  );

  const handleCropCancel = useCallback(() => {
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc(null);

    // Process remaining queue (skip this file)
    processNextInQueue(cropQueue);
  }, [cropSrc, cropQueue, processNextInQueue]);

  const handleFiles = useCallback(
    async (files: FileList) => {
      if (!canUpload) {
        toast.error("Please enter a slug first.");
        return;
      }

      const fileArray = Array.from(files);
      if (multiple && urls.length + fileArray.length > maxFiles) {
        toast.error(`Maximum ${maxFiles} images allowed.`);
        return;
      }

      // Queue all files for cropping
      if (fileArray.length > 0) {
        const [first, ...rest] = fileArray;
        setCropQueue(rest);
        const objectUrl = URL.createObjectURL(first);
        setCropSrc(objectUrl);
      }
    },
    [canUpload, multiple, urls, maxFiles]
  );

  const handleRemove = useCallback(
    async (urlToRemove: string) => {
      deleteImageAction(urlToRemove).catch(() => {});
      if (multiple) {
        onChange(urls.filter((u) => u !== urlToRemove));
      } else {
        onChange("");
      }
    },
    [multiple, urls, onChange]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      if (e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const moveImage = useCallback(
    (fromIndex: number, toIndex: number) => {
      const reordered = [...urls];
      const [moved] = reordered.splice(fromIndex, 1);
      reordered.splice(toIndex, 0, moved);
      onChange(reordered);
    },
    [urls, onChange]
  );

  const showDropzone = multiple ? !atLimit : urls.length === 0;

  // Aspect ratio style for preview containers (dynamic to support any ratio)
  const aspectStyle = { aspectRatio: String(aspectRatio) };

  // DnD sensors for drag-to-reorder
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (over && active.id !== over.id) {
        const oldIndex = urls.indexOf(active.id as string);
        const newIndex = urls.indexOf(over.id as string);
        if (oldIndex !== -1 && newIndex !== -1) {
          moveImage(oldIndex, newIndex);
        }
      }
    },
    [urls, moveImage]
  );

  return (
    <div className="space-y-2">
      {label && <Label>{label}</Label>}

      {/* Preview grid */}
      {urls.length > 0 && reorderable && multiple ? (
        <DndContext
          id="image-upload"
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={urls} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {urls.map((url, index) => (
                <SortableImageItem
                  key={url}
                  id={url}
                  url={url}
                  isPrimary={index === 0}
                  showPrimaryBadge={showPrimaryBadge}
                  aspectRatio={aspectRatio}
                  multiple={multiple}
                  onRemove={handleRemove}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : urls.length > 0 ? (
        <div
          className={cn(
            "grid gap-3",
            multiple
              ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"
              : !maxPreviewWidth && "max-w-xs"
          )}
          style={!multiple && maxPreviewWidth ? { maxWidth: maxPreviewWidth } : undefined}
        >
          {urls.map((url, index) => (
            <div
              key={url}
              className={cn(
                "group relative overflow-hidden rounded-lg ring-1 ring-border bg-white",
                multiple && "aspect-square",
                showPrimaryBadge && index === 0 && "ring-2 ring-primary"
              )}
              style={multiple ? undefined : aspectStyle}
            >
              <Image
                src={url}
                alt=""
                fill
                className="object-cover"
                sizes={multiple ? "200px" : `${maxPreviewWidth ?? 320}px`}
              />
              {showPrimaryBadge && index === 0 && (
                <span className="absolute left-1.5 top-1.5 rounded bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
                  Primary
                </span>
              )}
              <div className="absolute right-1.5 top-1.5 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  type="button"
                  onClick={() => handleRemove(url)}
                  className="rounded-full bg-destructive p-1 text-destructive-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                  <span className="sr-only">Remove</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {/* Dropzone */}
      {showDropzone && (
        <div
          onClick={() => canUpload && !isUploading && inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors",
            isDragOver
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-primary/50",
            !canUpload && "cursor-not-allowed opacity-50",
            isUploading && "pointer-events-none"
          )}
        >
          {isUploading ? (
            <>
              <Loader2 className="mb-2 h-8 w-8 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Uploading...</p>
            </>
          ) : (
            <>
              {multiple ? (
                <ImagePlus className="mb-2 h-8 w-8 text-muted-foreground/50" />
              ) : (
                <Upload className="mb-2 h-8 w-8 text-muted-foreground/50" />
              )}
              <p className="text-sm text-muted-foreground">
                {canUpload
                  ? "Click or drag to upload"
                  : "Enter a slug first to enable upload"}
              </p>
              {(aspectRatioLabel || recommendedPx) && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {aspectRatioLabel && <>Aspect ratio: {aspectRatioLabel}</>}
                  {aspectRatioLabel && recommendedPx && " · "}
                  {recommendedPx && <>Recommended: {recommendedPx}</>}
                </p>
              )}
              <p className="mt-1 text-xs text-muted-foreground/70">
                JPEG, PNG, WebP, AVIF, SVG &middot; Max 5MB
              </p>
            </>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif,image/svg+xml"
        multiple={multiple}
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            handleFiles(e.target.files);
            e.target.value = "";
          }
        }}
      />

      {/* Replace button for single mode when image exists */}
      {!multiple && urls.length > 0 && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!canUpload || isUploading}
          onClick={() => inputRef.current?.click()}
        >
          Replace image
        </Button>
      )}

      {/* Crop dialog */}
      {cropSrc && (
        <ImageCropDialog
          open={!!cropSrc}
          imageSrc={cropSrc}
          aspectRatio={aspectRatio}
          maxDimension={MAX_DIMENSIONS[folder]}
          onCrop={handleCrop}
          onCancel={handleCropCancel}
        />
      )}
    </div>
  );
}
