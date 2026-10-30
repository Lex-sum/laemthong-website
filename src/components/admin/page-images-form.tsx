"use client";

import { useState, useCallback } from "react";
import { ImageUpload } from "@/components/admin/image-upload";
import {
  upsertPageImageAction,
  deletePageImageAction,
} from "@/app/admin/actions/page-images";
import { toast } from "sonner";
import { TABS, SLOT_ICONS, type ImageSlot } from "@/data/page-image-slots";

interface PageImagesFormProps {
  images: Map<string, string>;
  activeSection: string;
}

export function PageImagesForm({ images, activeSection }: PageImagesFormProps) {
  const [imageMap, setImageMap] = useState<Map<string, string>>(
    () => new Map(images)
  );

  const tab = TABS.find((t) => t.value === activeSection) ?? TABS[0];

  const handleChange = useCallback(
    async (key: string, url: string | string[]) => {
      const imageUrl = Array.isArray(url) ? url[0] : url;

      if (!imageUrl) {
        setImageMap((prev) => {
          const next = new Map(prev);
          next.delete(key);
          return next;
        });
        const result = await deletePageImageAction(key);
        if (result.success) {
          toast.success("Image removed");
        } else {
          toast.error(result.message ?? "Failed to remove image");
        }
        return;
      }

      setImageMap((prev) => new Map(prev).set(key, imageUrl));
      const result = await upsertPageImageAction(key, imageUrl);
      if (result.success) {
        toast.success("Image saved");
      } else {
        toast.error(result.message ?? "Failed to save image");
      }
    },
    []
  );

  function renderSlot(slot: ImageSlot) {
    const SlotIcon = SLOT_ICONS[slot.key];
    return (
      <div key={slot.key} className="space-y-2">
        <div className="flex items-center gap-2">
          {SlotIcon && (
            <SlotIcon className="h-3.5 w-3.5 text-muted-foreground" />
          )}
          <span className="text-sm font-medium text-foreground">
            {slot.label}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">{slot.hint}</p>
        <ImageUpload
          value={imageMap.get(slot.key) ?? ""}
          onChange={(url) => handleChange(slot.key, url)}
          deleteOnRemove
          folder="pages"
          entitySlug={slot.key}
          aspectRatio={slot.aspectRatio}
          aspectRatioLabel={slot.aspectRatioLabel}
          recommendedPx={slot.recommendedPx}
          maxPreviewWidth={slot.maxPreviewWidth}
        />
      </div>
    );
  }

  function renderSlots(slots: ImageSlot[]) {
    const hasGroups = slots.some((s) => s.group);

    if (!hasGroups) {
      return (
        <div className={slots.length === 1 ? "max-w-xl" : "grid gap-6 sm:grid-cols-2"}>
          {slots.map(renderSlot)}
        </div>
      );
    }

    const heroSlots = slots.filter((s) => s.group === "hero");
    const contentSlots = slots.filter((s) => s.group === "content");

    return (
      <div className="space-y-8">
        {heroSlots.length > 0 && (
          <div>
            <h4 className="mb-4 text-xs font-medium uppercase tracking-widest text-muted-foreground">
              Hero Background
            </h4>
            <div className="max-w-xl">{heroSlots.map(renderSlot)}</div>
          </div>
        )}
        {contentSlots.length > 0 && (
          <div className={heroSlots.length > 0 ? "border-t pt-8" : ""}>
            <h4 className="mb-4 text-xs font-medium uppercase tracking-widest text-muted-foreground">
              Page Content
            </h4>
            <div className="grid gap-6 sm:grid-cols-2">
              {contentSlots.map(renderSlot)}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card">
      <div className="border-b px-6 py-4">
        <p className="text-sm text-muted-foreground">
          {tab.description}
        </p>
      </div>
      <div className="p-6">{renderSlots(tab.slots)}</div>
    </div>
  );
}
