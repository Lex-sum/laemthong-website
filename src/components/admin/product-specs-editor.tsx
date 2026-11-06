"use client";

import Link from "next/link";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { isEmptySpecValue } from "@/lib/spec-values";
import type { ProductSpecValues, SpecAttribute, SpecValue } from "@/data/types";

const NONE = "__none__";

/** Inputs for every spec of the product's category (main category's specs first). */
export function ProductSpecsEditor({
  categorySlug,
  specs,
  values,
  onChange,
  error,
}: {
  categorySlug: string;
  specs: SpecAttribute[];
  values: ProductSpecValues;
  onChange: (values: ProductSpecValues) => void;
  error?: string;
}) {
  const set = (id: string, value: SpecValue | undefined) => {
    const next = { ...values };
    if (!value || isEmptySpecValue(value)) delete next[id];
    else next[id] = value;
    onChange(next);
  };

  // Values that belong to specs of another category (the category was changed)
  const allowed = new Set(specs.map((s) => s.id));
  const dropped = Object.keys(values).filter((id) => !allowed.has(id) && !isEmptySpecValue(values[id]));

  if (!categorySlug) {
    return <p className="text-sm text-muted-foreground">Choose a category on the Basic Info tab to see its specs.</p>;
  }

  return (
    <div className="space-y-5">
      {dropped.length > 0 && (
        <p className="rounded-md border border-amber-500/50 bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-100">
          {dropped.length} spec value(s) from the previous category don&apos;t apply to this category and will be
          removed when you save.
        </p>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}

      {specs.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          This category has no specs yet.{" "}
          <Link href={`/admin/categories/${categorySlug}?tab=specs`} className="text-primary hover:underline" target="_blank">
            Add specs to the category →
          </Link>
        </p>
      ) : (
        <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
          {specs.map((spec) => (
            <SpecInput key={spec.id} spec={spec} value={values[spec.id]} onChange={(v) => set(spec.id, v)} />
          ))}
        </div>
      )}
      <p className="text-xs text-muted-foreground">
        All specs are optional. Filled-in specs show on the product page; specs marked as filters let customers
        find the product in the catalog.
      </p>
    </div>
  );
}

function SpecInput({
  spec,
  value,
  onChange,
}: {
  spec: SpecAttribute;
  value: SpecValue | undefined;
  onChange: (value: SpecValue | undefined) => void;
}) {
  const id = `spec-${spec.id}`;
  const label = (
    <Label htmlFor={id}>
      {spec.name.th}
      {spec.name.en && <span className="ml-1 font-normal text-muted-foreground">· {spec.name.en}</span>}
    </Label>
  );

  switch (spec.type) {
    case "single":
      return (
        <div className="space-y-1.5">
          {label}
          <Select
            value={value?.optionIds?.[0] ?? NONE}
            onValueChange={(v) => onChange(v === NONE ? undefined : { optionIds: [v] })}
          >
            <SelectTrigger id={id}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE} className="text-muted-foreground">
                —
              </SelectItem>
              {spec.options.map((o) => (
                <SelectItem key={o.id} value={o.id}>
                  {o.label.th}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );
    case "multi": {
      const selected = new Set(value?.optionIds ?? []);
      return (
        <div className="space-y-1.5 sm:col-span-2">
          {label}
          {spec.options.length === 0 ? (
            <p className="text-xs text-muted-foreground">No values defined yet.</p>
          ) : (
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              {spec.options.map((o) => (
                <label key={o.id} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={selected.has(o.id)}
                    onCheckedChange={(checked) => {
                      const next = new Set(selected);
                      if (checked) next.add(o.id);
                      else next.delete(o.id);
                      // Keep the spec's option order
                      onChange({ optionIds: spec.options.map((x) => x.id).filter((x) => next.has(x)) });
                    }}
                  />
                  {o.label.th}
                </label>
              ))}
            </div>
          )}
        </div>
      );
    }
    case "number":
      return (
        <div className="space-y-1.5">
          {label}
          <div className="flex items-center gap-2">
            <Input
              id={id}
              type="number"
              step="any"
              value={value?.number ?? ""}
              onChange={(e) => onChange(e.target.value === "" ? undefined : { number: Number(e.target.value) })}
            />
            {spec.unit && <span className="text-sm text-muted-foreground">{spec.unit}</span>}
          </div>
        </div>
      );
    case "boolean":
      return (
        <div className="space-y-1.5">
          {label}
          <Select
            value={value?.bool === undefined ? NONE : value.bool ? "yes" : "no"}
            onValueChange={(v) => onChange(v === NONE ? undefined : { bool: v === "yes" })}
          >
            <SelectTrigger id={id}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE} className="text-muted-foreground">
                —
              </SelectItem>
              <SelectItem value="yes">มี / Yes</SelectItem>
              <SelectItem value="no">ไม่มี / No</SelectItem>
            </SelectContent>
          </Select>
        </div>
      );
    case "text":
      return (
        <div className="space-y-1.5 sm:col-span-2">
          {label}
          <div className="grid gap-2 sm:grid-cols-2">
            <Input
              id={id}
              placeholder="TH"
              value={value?.text?.th ?? ""}
              onChange={(e) => onChange({ text: { th: e.target.value, en: value?.text?.en ?? "" } })}
            />
            <Input
              placeholder="EN (optional)"
              value={value?.text?.en ?? ""}
              onChange={(e) => onChange({ text: { th: value?.text?.th ?? "", en: e.target.value } })}
            />
          </div>
        </div>
      );
  }
}
