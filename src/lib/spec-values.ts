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

const YES = new Set(["yes", "y", "true", "1", "มี", "ได้", "ใช่"]);
const NO = new Set(["no", "n", "false", "0", "ไม่มี", "ไม่ได้", "ไม่ใช่"]);
const norm = (s: string) => s.trim().toLowerCase();

/** Option matching a spreadsheet cell: its key, or its TH / EN label (case-insensitive). */
function findOption(spec: SpecAttribute, text: string) {
  const t = norm(text);
  return spec.options.find((o) => o.key === t || norm(o.label.th) === t || (o.label.en && norm(o.label.en) === t));
}

/**
 * Reads one spreadsheet cell for a spec. A blank cell clears the value (value undefined).
 * Several values are separated with "|". Numbers may carry the unit ("200 A").
 * For text specs, `cellEn` is the `spec:<key>:en` column (undefined when not in the file).
 */
export function parseSpecCell(
  spec: SpecAttribute,
  cell: string,
  cellEn?: string
): { value?: SpecValue; error?: string } {
  const text = cell.trim();
  if (spec.type === "text") {
    return text || cellEn?.trim() ? { value: { text: { th: text, en: cellEn?.trim() ?? "" } } } : {};
  }
  if (!text) return {};
  const allowed = () => spec.options.map((o) => o.label.th).join(", ");

  switch (spec.type) {
    case "single":
    case "multi": {
      const parts = text.split("|").map((p) => p.trim()).filter(Boolean);
      if (spec.type === "single" && parts.length > 1) return { error: `choose only one value (${text})` };
      const ids: string[] = [];
      for (const part of parts) {
        const option = findOption(spec, part);
        if (!option) return { error: `unknown value "${part}" — use one of: ${allowed() || "(no values defined yet)"}` };
        ids.push(option.id);
      }
      return { value: { optionIds: [...new Set(ids)] } };
    }
    case "number": {
      let raw = text.replace(/,/g, "").replace(/\s+/g, "");
      if (spec.unit && raw.toLowerCase().endsWith(spec.unit.toLowerCase().replace(/\s+/g, ""))) {
        raw = raw.slice(0, raw.length - spec.unit.replace(/\s+/g, "").length);
      }
      const n = Number(raw);
      return raw !== "" && Number.isFinite(n) ? { value: { number: n } } : { error: `"${text}" is not a number` };
    }
    case "boolean": {
      const t = norm(text);
      if (YES.has(t)) return { value: { bool: true } };
      if (NO.has(t)) return { value: { bool: false } };
      return { error: `"${text}" — use มี / ไม่มี (yes / no)` };
    }
  }
}

/** Spreadsheet cell text for a spec value (the reverse of parseSpecCell). */
export function specCellText(spec: SpecAttribute, value: SpecValue | undefined): { th: string; en: string } {
  if (!value) return { th: "", en: "" };
  switch (spec.type) {
    case "single":
    case "multi":
      return {
        th: spec.options.filter((o) => value.optionIds?.includes(o.id)).map((o) => o.label.th).join("|"),
        en: "",
      };
    case "number":
      return { th: value.number === undefined ? "" : String(value.number), en: "" };
    case "boolean":
      return { th: value.bool === undefined ? "" : value.bool ? "มี" : "ไม่มี", en: "" };
    case "text":
      return { th: value.text?.th ?? "", en: value.text?.en ?? "" };
  }
}

/** Rows for values that were already checked (e.g. by the bulk import validator). */
export function specValueRows(values: Record<string, SpecValue | null>): SpecValueRow[] {
  const base = { option_id: null, number_value: null, bool_value: null, text_value: null };
  return Object.entries(values).flatMap(([attributeId, value]): SpecValueRow[] => {
    if (!value) return [];
    if (value.optionIds) return value.optionIds.map((id) => ({ ...base, attribute_id: attributeId, option_id: id }));
    if (value.number !== undefined) return [{ ...base, attribute_id: attributeId, number_value: value.number }];
    if (value.bool !== undefined) return [{ ...base, attribute_id: attributeId, bool_value: value.bool }];
    if (value.text) return [{ ...base, attribute_id: attributeId, text_value: value.text }];
    return [];
  });
}
