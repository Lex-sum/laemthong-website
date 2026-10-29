"use client";

import { useState } from "react";
import { slugify } from "@/lib/utils";

interface UseFormSlugOptions {
  initialSlug: string;
  initialName: string;
  isEditing: boolean;
  /** Start in custom mode (e.g. slug pre-filled from SAP) so the name doesn't overwrite it. */
  initialCustom?: boolean;
}

export function useFormSlug({
  initialSlug,
  initialName,
  isEditing,
  initialCustom = false,
}: UseFormSlugOptions) {
  const [isCustomSlug, setIsCustomSlug] = useState(() =>
    initialCustom ||
    (isEditing && initialName ? initialSlug !== slugify(initialName) : false)
  );
  const [customSlug, setCustomSlug] = useState(initialSlug);
  const [trackedName, setTrackedName] = useState(initialName);

  // Derive slug during render instead of syncing via effects
  const slug = isCustomSlug ? customSlug : slugify(trackedName);

  const handleNameChange = (name: string) => {
    setTrackedName(name);
  };

  return {
    slug,
    setSlug: setCustomSlug,
    isCustomSlug,
    setIsCustomSlug,
    handleNameChange,
  };
}
