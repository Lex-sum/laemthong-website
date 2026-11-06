"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, Loader2, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { saveSpecAction } from "@/app/admin/actions/taxonomy";
import { formatBucket } from "@/lib/spec-format";
import { slugify } from "@/lib/utils";
import type { SpecAttribute, SpecType } from "@/data/types";

export const SPEC_TYPE_LABEL: Record<SpecType, string> = {
  single: "Choose one",
  multi: "Choose several",
  number: "Number",
  boolean: "Yes / No",
  text: "Text",
};

const TYPE_HELP: Record<SpecType, string> = {
  single: "A product has one of the values, e.g. Technology: Inverter.",
  multi: "A product can have several values, e.g. Input power: 220V and 380V.",
  number: "A number with a unit, e.g. Max current 200 A. Ranges become the filter choices.",
  boolean: "Has it or not, e.g. Generator compatible.",
  text: "Free text shown on the product page only (not a filter), e.g. Table size 1.5 × 3 m.",
};

type OptionRow = { id?: string; key: string; th: string; en: string; keyTouched: boolean };
type BucketRow = { min: string; max: string };

function optionKey(row: Pick<OptionRow, "th" | "en">, taken: Set<string>): string {
  const base = slugify(row.en) || slugify(row.th) || "value";
  let key = base;
  for (let n = 2; taken.has(key); n++) key = `${base}-${n}`;
  return key;
}

const toNumber = (value: string) => (value.trim() === "" ? null : Number(value));

/** Create / edit one spec of a category, including its values. */
export function SpecDialog({
  open,
  onOpenChange,
  categorySlug,
  spec,
  usage,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categorySlug: string;
  spec?: SpecAttribute;
  /** Products using the spec and each of its options */
  usage: { attributes: Record<string, number>; options: Record<string, number> };
  onSaved: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        {open && (
          <SpecForm
            key={spec?.id ?? "new"}
            categorySlug={categorySlug}
            spec={spec}
            usage={usage}
            onDone={() => {
              onOpenChange(false);
              onSaved();
            }}
            onCancel={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function SpecForm({
  categorySlug,
  spec,
  usage,
  onDone,
  onCancel,
}: {
  categorySlug: string;
  spec?: SpecAttribute;
  usage: { attributes: Record<string, number>; options: Record<string, number> };
  onDone: () => void;
  onCancel: () => void;
}) {
  const inUse = spec ? (usage.attributes[spec.id] ?? 0) : 0;
  const [nameTh, setNameTh] = useState(spec?.name.th ?? "");
  const [nameEn, setNameEn] = useState(spec?.name.en ?? "");
  const [key, setKey] = useState(spec?.key ?? "");
  const [keyTouched, setKeyTouched] = useState(!!spec);
  const [type, setType] = useState<SpecType>(spec?.type ?? "single");
  const [unit, setUnit] = useState(spec?.unit ?? "");
  const [filterable, setFilterable] = useState(spec?.filterable ?? true);
  const [options, setOptions] = useState<OptionRow[]>(
    spec?.options.map((o) => ({ id: o.id, key: o.key, th: o.label.th, en: o.label.en, keyTouched: true })) ?? []
  );
  const [buckets, setBuckets] = useState<BucketRow[]>(
    spec?.buckets.map((b) => ({ min: b.min?.toString() ?? "", max: b.max?.toString() ?? "" })) ?? []
  );
  const [paste, setPaste] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const usesOptions = type === "single" || type === "multi";
  const removedInUse = (spec?.options ?? []).filter(
    (o) => !options.some((row) => row.id === o.id) && (usage.options[o.id] ?? 0) > 0
  );
  const removedProducts = removedInUse.reduce((n, o) => n + (usage.options[o.id] ?? 0), 0);

  function updateOption(index: number, patch: Partial<OptionRow>) {
    setOptions((rows) =>
      rows.map((row, i) => {
        if (i !== index) return row;
        const next = { ...row, ...patch };
        if (!next.keyTouched && !next.id && ("th" in patch || "en" in patch)) {
          const taken = new Set(rows.filter((_, j) => j !== i).map((r) => r.key));
          next.key = optionKey(next, taken);
        }
        return next;
      })
    );
  }

  function moveOption(index: number, delta: number) {
    setOptions((rows) => {
      const target = index + delta;
      if (target < 0 || target >= rows.length) return rows;
      const next = [...rows];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  /** One value per line: "TH | EN" (EN optional) */
  function addPasted() {
    const lines = paste.split("\n").map((l) => l.trim()).filter(Boolean);
    setOptions((rows) => {
      const taken = new Set(rows.map((r) => r.key));
      const added = lines.map((line) => {
        const [th, en = ""] = line.split("|").map((s) => s.trim());
        const row = { th, en, key: "", keyTouched: false };
        row.key = optionKey(row, taken);
        taken.add(row.key);
        return row;
      });
      return [...rows, ...added];
    });
    setPaste("");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (removedProducts > 0 && !window.confirm(
      `${removedInUse.length} removed value(s) are used by ${removedProducts} product value(s). Those products lose these values. Continue?`
    )) {
      return;
    }
    setIsPending(true);
    const result = await saveSpecAction({
      id: spec?.id,
      categorySlug,
      key: key || slugify(nameEn) || slugify(nameTh),
      name: { th: nameTh, en: nameEn },
      type,
      unit,
      filterable,
      buckets: buckets
        .filter((b) => b.min.trim() !== "" || b.max.trim() !== "")
        .map((b) => ({ min: toNumber(b.min), max: toNumber(b.max) })),
      options: usesOptions
        ? options.map((o) => ({ id: o.id, key: o.key, label: { th: o.th, en: o.en } }))
        : [],
    });
    setIsPending(false);
    if (result.success) {
      toast.success(spec ? "Spec updated" : "Spec added");
      onDone();
    } else {
      setError(result.message ?? "Failed to save");
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <DialogHeader>
        <DialogTitle>{spec ? `Edit spec "${spec.name.en || spec.name.th}"` : "Add spec"}</DialogTitle>
        <DialogDescription>
          {inUse > 0
            ? `${inUse} products have a value for this spec — the type and key can't change.`
            : "Specs show on the product page and (when enabled) as filters in the catalog."}
        </DialogDescription>
      </DialogHeader>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="spec-th">Name (TH) *</Label>
          <Input id="spec-th" value={nameTh} onChange={(e) => setNameTh(e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="spec-en">Name (EN)</Label>
          <Input
            id="spec-en"
            value={nameEn}
            onChange={(e) => {
              setNameEn(e.target.value);
              if (!keyTouched) setKey(slugify(e.target.value));
            }}
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="spec-key">Key</Label>
          <Input
            id="spec-key"
            value={key}
            disabled={inUse > 0}
            className="font-mono"
            placeholder="from-english-name"
            onChange={(e) => {
              setKey(e.target.value);
              setKeyTouched(true);
            }}
          />
          <p className="text-xs text-muted-foreground">
            Column name in import files (<code>spec:{key || "key"}</code>) and in filter links.
          </p>
        </div>
        <div className="space-y-1.5">
          <Label>Type</Label>
          <Select value={type} onValueChange={(v) => setType(v as SpecType)} disabled={inUse > 0}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(SPEC_TYPE_LABEL) as SpecType[]).map((t) => (
                <SelectItem key={t} value={t}>
                  {SPEC_TYPE_LABEL[t]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">{TYPE_HELP[type]}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-6">
        {type === "number" && (
          <div className="flex items-center gap-2">
            <Label htmlFor="spec-unit">Unit</Label>
            <Input id="spec-unit" value={unit} onChange={(e) => setUnit(e.target.value)} className="w-28" placeholder="A, mm, bar" />
          </div>
        )}
        {type !== "text" && (
          <div className="flex items-center gap-2">
            <Switch id="spec-filter" checked={filterable} onCheckedChange={setFilterable} />
            <Label htmlFor="spec-filter">Use as a filter in the catalog</Label>
          </div>
        )}
      </div>

      {usesOptions && (
        <div className="space-y-2">
          <Label>Values ({options.length})</Label>
          {options.length > 0 && (
            <div className="space-y-2">
              <div className="grid grid-cols-[1fr_1fr_8rem_auto] gap-2 text-xs text-muted-foreground">
                <span>TH *</span>
                <span>EN</span>
                <span>Key</span>
                <span />
              </div>
              {options.map((row, index) => {
                const used = row.id ? (usage.options[row.id] ?? 0) : 0;
                return (
                  <div key={row.id ?? `new-${index}`} className="grid grid-cols-[1fr_1fr_8rem_auto] items-center gap-2">
                    <Input value={row.th} onChange={(e) => updateOption(index, { th: e.target.value })} required />
                    <Input value={row.en} onChange={(e) => updateOption(index, { en: e.target.value })} />
                    <Input
                      value={row.key}
                      className="font-mono text-xs"
                      onChange={(e) => updateOption(index, { key: e.target.value, keyTouched: true })}
                      required
                    />
                    <div className="flex items-center">
                      {used > 0 && (
                        <span className="mr-1 text-xs tabular-nums text-muted-foreground" title="Products using this value">
                          {used}
                        </span>
                      )}
                      <Button type="button" variant="ghost" size="icon" className="h-8 w-8" aria-label="Move up" onClick={() => moveOption(index, -1)}>
                        <ArrowUp className="h-3.5 w-3.5" />
                      </Button>
                      <Button type="button" variant="ghost" size="icon" className="h-8 w-8" aria-label="Move down" onClick={() => moveOption(index, 1)}>
                        <ArrowDown className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        aria-label="Remove value"
                        onClick={() => setOptions((rows) => rows.filter((_, i) => i !== index))}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setOptions((rows) => [...rows, { th: "", en: "", key: optionKey({ th: "", en: "" }, new Set(rows.map((r) => r.key))), keyTouched: false }])}
          >
            <Plus className="mr-1 h-3.5 w-3.5" />
            Add value
          </Button>
          <div className="space-y-1.5 pt-2">
            <Label htmlFor="spec-paste" className="text-xs text-muted-foreground">
              Add several at once — one per line, <code>TH | EN</code>
            </Label>
            <Textarea id="spec-paste" value={paste} onChange={(e) => setPaste(e.target.value)} rows={3} placeholder={"ทองเหลือง | Brass\nสแตนเลส | Stainless Steel"} />
            <Button type="button" variant="outline" size="sm" onClick={addPasted} disabled={!paste.trim()}>
              Add lines
            </Button>
          </div>
          {removedProducts > 0 && (
            <p className="text-xs text-amber-600">
              Removing {removedInUse.map((o) => o.label.th).join(", ")} takes these values off {removedProducts} product
              value(s) when you save.
            </p>
          )}
        </div>
      )}

      {type === "number" && filterable && (
        <div className="space-y-2">
          <Label>Filter ranges{unit ? ` (${unit})` : ""}</Label>
          <p className="text-xs text-muted-foreground">
            Each range covers values above Min up to and including Max. Leave Min empty for &quot;up to&quot;, Max
            empty for &quot;more than&quot;. Without ranges the filter isn&apos;t shown.
          </p>
          {buckets.map((bucket, index) => {
            const min = toNumber(bucket.min);
            const max = toNumber(bucket.max);
            return (
              <div key={index} className="flex items-center gap-2">
                <Input type="number" step="any" placeholder="Min" value={bucket.min} className="w-28"
                  onChange={(e) => setBuckets((rows) => rows.map((r, i) => (i === index ? { ...r, min: e.target.value } : r)))} />
                <span className="text-muted-foreground">–</span>
                <Input type="number" step="any" placeholder="Max" value={bucket.max} className="w-28"
                  onChange={(e) => setBuckets((rows) => rows.map((r, i) => (i === index ? { ...r, max: e.target.value } : r)))} />
                <span className="w-32 text-sm text-muted-foreground">
                  {min !== null || max !== null ? formatBucket({ min, max }, unit, "en") : ""}
                </span>
                <Button type="button" variant="ghost" size="icon" className="h-8 w-8" aria-label="Remove range"
                  onClick={() => setBuckets((rows) => rows.filter((_, i) => i !== index))}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            );
          })}
          <Button type="button" variant="outline" size="sm" onClick={() => setBuckets((rows) => [...rows, { min: rows.at(-1)?.max ?? "", max: "" }])}>
            <Plus className="mr-1 h-3.5 w-3.5" />
            Add range
          </Button>
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {spec ? "Save" : "Add spec"}
        </Button>
      </DialogFooter>
    </form>
  );
}
