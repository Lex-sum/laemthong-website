import { unstable_cache } from "next/cache";
import { createSupabaseClient } from "@/lib/supabase";
import { SERVICES as LEGACY_SERVICES } from "@/data/services";
import th from "../../../messages/th.json";
import en from "../../../messages/en.json";
import type { DbService, LocalizedString, Service } from "@/data/types";

export const SERVICES_TAG = "services";

export function toService(row: DbService): Service {
  return {
    slug: row.slug,
    title: row.title,
    shortDescription: row.short_description,
    description: row.description,
    features: row.features ?? [],
    expertise: row.expertise ?? [],
    processSteps: row.process_steps ?? [],
    metaTitle: row.meta_title,
    metaDescription: row.meta_description,
    isPrimary: row.is_primary,
    imageUrl: row.image_url,
    sortOrder: row.sort_order,
    updatedAt: row.updated_at,
  };
}

type LegacyService = {
  title: string;
  shortDescription: string;
  description: string;
  features: string[];
  processSteps: { title: string; description: string }[];
  expertise: string[];
  metaTitle: string;
  metaDescription: string;
};

/** The 4 original services from messages/*.json — used only if the services table can't be read. */
function legacyServices(): Service[] {
  const thAll = th.services as unknown as Record<string, LegacyService>;
  const enAll = en.services as unknown as Record<string, LegacyService>;
  return LEGACY_SERVICES.map(({ slug, primary, sortOrder }) => {
    const t = thAll[slug];
    const e = enAll[slug];
    const ls = (a: string, b: string): LocalizedString => ({ th: a, en: b });
    return {
      slug,
      title: ls(t.title, e.title),
      shortDescription: ls(t.shortDescription, e.shortDescription),
      description: ls(t.description, e.description),
      features: t.features.map((x, i) => ls(x, e.features[i])),
      expertise: t.expertise.map((x, i) => ls(x, e.expertise[i])),
      processSteps: t.processSteps.map((s, i) => ({
        title: ls(s.title, e.processSteps[i].title),
        description: ls(s.description, e.processSteps[i].description),
      })),
      metaTitle: ls(t.metaTitle, e.metaTitle),
      metaDescription: ls(t.metaDescription, e.metaDescription),
      isPrimary: primary,
      imageUrl: null,
      sortOrder,
    };
  });
}

export const SERVICE_COLUMNS =
  "slug, title, short_description, description, icon, features, expertise, process_steps, meta_title, meta_description, is_primary, image_url, sort_order, updated_at";

async function fetchServices(): Promise<Service[]> {
  const supabase = createSupabaseClient();
  // Selecting the new columns explicitly makes this fail (→ legacy fallback) until the
  // admin_cms migration has been run, instead of returning the old, empty table.
  const { data, error } = await supabase
    .from("services")
    .select(SERVICE_COLUMNS)
    .order("sort_order", { ascending: true });
  if (error || !data) return legacyServices();
  return (data as DbService[]).map(toService);
}

/** All services in display order. Cached; invalidated when an admin saves a service. */
export const getAllServices = unstable_cache(fetchServices, ["all-services"], {
  revalidate: 3600,
  tags: [SERVICES_TAG],
});

export async function getServiceBySlug(slug: string): Promise<Service | undefined> {
  return (await getAllServices()).find((s) => s.slug === slug);
}
