import { unstable_cache } from "next/cache";
import { createSupabaseClient } from "@/lib/supabase";
import type { Locale } from "@/data/types";

/**
 * Admin-edited website text. Rows in `site_content` override individual
 * next-intl messages; anything without a row keeps the value from messages/*.json.
 */
export const SITE_CONTENT_TAG = "site-content";

export type ContentValue = { th?: string; en?: string };
export type ContentOverrides = Record<string, ContentValue>;

async function fetchOverrides(): Promise<ContentOverrides> {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase.from("site_content").select("key, value");
  if (error || !data) return {}; // e.g. table not created yet → site keeps file text
  return Object.fromEntries(data.map((row) => [row.key as string, row.value as ContentValue]));
}

export const getContentOverrides = unstable_cache(fetchOverrides, ["site-content"], {
  revalidate: 3600,
  tags: [SITE_CONTENT_TAG],
});

type Messages = Record<string, unknown>;

/** Returns a copy of `messages` with overrides applied. Only replaces existing string leaves. */
export function applyContentOverrides(
  messages: Messages,
  overrides: ContentOverrides,
  locale: Locale
): Messages {
  const entries = Object.entries(overrides);
  if (entries.length === 0) return messages;

  const result = structuredClone(messages);
  for (const [key, value] of entries) {
    const text = value?.[locale];
    if (typeof text !== "string" || text.trim() === "") continue;

    const path = key.split(".");
    const leaf = path.pop()!;
    let node: unknown = result;
    for (const part of path) {
      node = (node as Messages | undefined)?.[part];
    }
    const parent = node as Messages | undefined;
    if (parent && typeof parent[leaf] === "string") parent[leaf] = text;
  }
  return result;
}

/** Reads a message by dotted path, e.g. getMessage(th, "hero.title"). */
export function getMessage(messages: Messages, key: string): string {
  const value = key.split(".").reduce<unknown>((node, part) => (node as Messages | undefined)?.[part], messages);
  return typeof value === "string" ? value : "";
}
