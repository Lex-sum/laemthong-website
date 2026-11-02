import type { LocalizedString } from "@/data/types";

/**
 * Product English text is optional (only the Thai name and short description are
 * required). These helpers fill the gaps for display; the English page of a product
 * without English is marked noindex and left out of the sitemap (see products/[slug]).
 */

const filled = (s: string | undefined | null) => typeof s === "string" && s.trim() !== "";

/** A product "has English" once its English name and short description are entered. */
export function hasEnglish(row: { name: LocalizedString; short_description?: LocalizedString; shortDescription?: LocalizedString }): boolean {
  const short = row.short_description ?? row.shortDescription;
  return filled(row.name?.en) && filled(short?.en);
}

/** Empty English → Thai. */
export function fillEnglish(value: LocalizedString | undefined | null): LocalizedString {
  const th = value?.th ?? "";
  return { th, en: filled(value?.en) ? value!.en : th };
}

/** Long description is optional: fall back to the short description, then the other language. */
export function fillDescription(
  description: LocalizedString | undefined | null,
  short: LocalizedString
): LocalizedString {
  const th = filled(description?.th) ? description!.th : short.th;
  const en = filled(description?.en) ? description!.en : filled(short.en) && short.en !== short.th ? short.en : th;
  return { th, en };
}
