"use client";

import { useCallback } from "react";
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
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { SortableFieldItem } from "./sortable-field-item";
import type { LocalizedString } from "@/data/types";

interface ProductFeaturesSectionProps {
  features: LocalizedString[];
  onFeaturesChange: (features: LocalizedString[]) => void;
  /** Overrides for reuse outside the product form (e.g. service expertise). */
  label?: string;
  description?: string;
  itemName?: string;
  dndId?: string;
}

export function ProductFeaturesSection({
  features,
  onFeaturesChange,
  label = "Features (Optional)",
  description = "Key benefits or highlights displayed as bullet points on the product page",
  itemName = "Feature",
  dndId = "product-features",
}: ProductFeaturesSectionProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const ids = features.map((_, i) => `feature-${i}`);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (over && active.id !== over.id) {
        const oldIndex = ids.indexOf(active.id as string);
        const newIndex = ids.indexOf(over.id as string);
        if (oldIndex !== -1 && newIndex !== -1) {
          const reordered = [...features];
          const [moved] = reordered.splice(oldIndex, 1);
          reordered.splice(newIndex, 0, moved);
          onFeaturesChange(reordered);
        }
      }
    },
    [features, onFeaturesChange, ids]
  );

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>{label}</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onFeaturesChange([...features, { th: "", en: "" }])}
          >
            Add {itemName}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          {description}
        </p>
      </div>

      {features.length > 0 && (
        <DndContext
          id={dndId}
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={ids} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {features.map((feature, i) => (
                <SortableFieldItem
                  key={ids[i]}
                  id={ids[i]}
                  title={feature.en || feature.th || `${itemName} #${i + 1}`}
                  onRemove={() =>
                    onFeaturesChange(features.filter((_, j) => j !== i))
                  }
                >
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Input
                      placeholder={`${itemName} (TH)`}
                      value={feature.th}
                      onChange={(e) => {
                        const updated = [...features];
                        updated[i] = { ...updated[i], th: e.target.value };
                        onFeaturesChange(updated);
                      }}
                    />
                    <Input
                      placeholder={`${itemName} (EN)`}
                      value={feature.en}
                      onChange={(e) => {
                        const updated = [...features];
                        updated[i] = { ...updated[i], en: e.target.value };
                        onFeaturesChange(updated);
                      }}
                    />
                  </div>
                </SortableFieldItem>
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
