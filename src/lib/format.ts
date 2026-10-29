/**
 * Converts a slug like "lincoln-electric" to "Lincoln Electric".
 */
export function formatSlug(slug: string): string {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

const qtyFormat = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });

/** Stock quantity, e.g. 1234.5 → "1,234.5". */
export function formatQty(n: number): string {
  return qtyFormat.format(n);
}
