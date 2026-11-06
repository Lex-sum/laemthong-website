import type { ProductSpecValues, SpecAttribute, SpecValue } from "@/data/types";

/** One product_spec_values row (without the product slug). */
export type SpecValueRow = {
  attribute_id: string;
  option_id: string | null;
  number_value: number | null;
  bool_value: boolean | null;
  text_value: { th: string; en: string } | null;
};

/**
 * Checks a product's spec values against the specs its category allows and turns them
 * into rows. Values for specs outside the category are dropped (reported in `dropped`);
 * empty values are simply left out.
 */
export function normalizeSpecValues(
  values: ProductSpecValues,
  specs: SpecAttribute[]
): { rows: SpecValueRow[]; errors: string[]; dropped: string[] } {
  const byId = new Map(specs.map((s) => [s.id, s]));
  const rows: SpecValueRow[] = [];
  const errors: string[] = [];
  const dropped: string[] = [];
  const base = { option_id: null, number_value: null, bool_value: null, text_value: null };

  for (const [attributeId, value] of Object.entries(values)) {
    const spec = byId.get(attributeId);
    if (!spec) {
      if (!isEmptySpecValue(value)) dropped.push(attributeId);
      continue;
    }
    const name = spec.name.th || spec.key;
    switch (spec.type) {
      case "single":
      case "multi": {
        const ids = [...new Set(value.optionIds ?? [])];
        const unknown = ids.filter((id) => !spec.options.some((o) => o.id === id));
        if (unknown.length > 0) errors.push(`${name}: unknown value`);
        else if (spec.type === "single" && ids.length > 1) errors.push(`${name}: choose only one value`);
        else ids.forEach((id) => rows.push({ ...base, attribute_id: attributeId, option_id: id }));
        break;
      }
      case "number":
        if (value.number === undefined) break;
        if (!Number.isFinite(value.number)) errors.push(`${name}: not a number`);
        else rows.push({ ...base, attribute_id: attributeId, number_value: value.number });
        break;
      case "boolean":
        if (value.bool !== undefined) rows.push({ ...base, attribute_id: attributeId, bool_value: value.bool });
        break;
      case "text": {
        const th = value.text?.th.trim() ?? "";
        const en = value.text?.en.trim() ?? "";
        if (th || en) rows.push({ ...base, attribute_id: attributeId, text_value: { th, en } });
        break;
      }
    }
  }
  return { rows, errors, dropped };
}

export function isEmptySpecValue(value: SpecValue | undefined): boolean {
  if (!value) return true;
  return (
    (value.optionIds?.length ?? 0) === 0 &&
    value.number === undefined &&
    value.bool === undefined &&
    !value.text?.th.trim() &&
    !value.text?.en.trim()
  );
}
