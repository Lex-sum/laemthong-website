import type { Locale, SpecAttribute, SpecBucket, SpecValue } from "@/data/types";

const fmt = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 3 });

/** "≤ 160 A", "160–250 A", "> 400 A" — a range covers min < value <= max. */
export function formatBucket(bucket: SpecBucket, unit: string, locale: Locale): string {
  const u = unit ? ` ${unit}` : "";
  if (bucket.min === null && bucket.max !== null) return `≤ ${fmt(bucket.max)}${u}`;
  if (bucket.max === null && bucket.min !== null) return `> ${fmt(bucket.min)}${u}`;
  if (bucket.min !== null && bucket.max !== null) return `${fmt(bucket.min)}–${fmt(bucket.max)}${u}`;
  return locale === "th" ? "ทั้งหมด" : "Any";
}

/** Display text of a product's value for one spec, or null when it has none. */
export function formatSpecValue(attribute: SpecAttribute, value: SpecValue | undefined, locale: Locale): string | null {
  if (!value) return null;
  switch (attribute.type) {
    case "single":
    case "multi": {
      const labels = attribute.options
        .filter((o) => value.optionIds?.includes(o.id))
        .map((o) => o.label[locale] || o.label.th);
      return labels.length > 0 ? labels.join(", ") : null;
    }
    case "number":
      return value.number === undefined ? null : `${fmt(value.number)}${attribute.unit ? ` ${attribute.unit}` : ""}`;
    case "boolean":
      if (value.bool === undefined) return null;
      return value.bool ? (locale === "th" ? "มี" : "Yes") : locale === "th" ? "ไม่มี" : "No";
    case "text":
      return value.text ? value.text[locale] || value.text.th || null : null;
  }
}
