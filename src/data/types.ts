export type Locale = "th" | "en";

export interface LocalizedString {
  th: string;
  en: string;
}

export interface ProductListItem {
  slug: string;
  categorySlug: string;
  brandSlug: string;
  name: LocalizedString;
  shortDescription: LocalizedString;
  images: string[];
  featured: boolean;
  sortOrder: number;
  /** English name + short description were entered (otherwise EN shows the Thai text). */
  hasEnglish: boolean;
}

export interface Product extends ProductListItem {
  description: LocalizedString;
  features: LocalizedString[];
  documents?: { name: string; url: string }[];
}

export interface Category {
  slug: string;
  name: LocalizedString;
  description: LocalizedString;
  /** Main category of a sub category; null for a main category */
  parentSlug: string | null;
  productCount?: number;
  sortOrder: number;
}

export interface Brand {
  slug: string;
  name: string;
  logo: string;
  description: LocalizedString;
  website?: string;
  country: string;
  productCount?: number;
  sortOrder: number;
}

export interface CompanyInfo {
  name: LocalizedString;
  tagline: LocalizedString;
  description: LocalizedString;
  yearEstablished: number;
  address: LocalizedString;
  phone: string;
  email: string;
  lineId?: string;
  mapUrl: string;
  coordinates: { lat: number; lng: number };
  businessHours: LocalizedString;
  stats: CompanyStats;
}

export interface ServiceStep {
  title: LocalizedString;
  description: LocalizedString;
}

export interface Service {
  slug: string;
  title: LocalizedString;
  shortDescription: LocalizedString;
  description: LocalizedString;
  features: LocalizedString[];
  expertise: LocalizedString[];
  processSteps: ServiceStep[];
  metaTitle: LocalizedString;
  metaDescription: LocalizedString;
  isPrimary: boolean;
  imageUrl: string | null;
  sortOrder: number;
  updatedAt?: string;
}

export interface CompanyStats {
  years: number;
  brands: number;
  products: number;
  clients: number;
}

// ========================================
// Database row types (snake_case, JSONB)
// ========================================

export interface DbCategory {
  slug: string;
  name: LocalizedString;
  description: LocalizedString;
  sort_order: number;
  /** Main category of a sub category; null for a main category */
  parent_slug: string | null;
  updated_at: string;
}

// ── Product specs (defined per category; a main category's specs apply to its subs) ──

export type SpecType = "single" | "multi" | "number" | "boolean" | "text";

export interface SpecOption {
  id: string;
  key: string;
  label: LocalizedString;
  sortOrder: number;
}

/** Number range used as a filter choice: min < value <= max (null = open end) */
export interface SpecBucket {
  min: number | null;
  max: number | null;
}

export interface SpecAttribute {
  id: string;
  categorySlug: string;
  key: string;
  name: LocalizedString;
  type: SpecType;
  unit: string;
  filterable: boolean;
  buckets: SpecBucket[];
  sortOrder: number;
  /** Choices for single / multi specs */
  options: SpecOption[];
}

/** A product's value for one spec, keyed by attribute id */
export interface SpecValue {
  optionIds?: string[];
  number?: number;
  bool?: boolean;
  text?: LocalizedString;
}

export type ProductSpecValues = Record<string, SpecValue>;

export interface DbBrand {
  slug: string;
  name: string;
  logo: string;
  description: LocalizedString;
  website: string | null;
  country: string;
  sort_order: number;
  updated_at: string;
}

export interface DbProduct {
  slug: string;
  category_slug: string;
  brand_slug: string;
  name: LocalizedString;
  short_description: LocalizedString;
  description: LocalizedString;
  images: string[];
  features: LocalizedString[];
  documents: { name: string; url: string }[];
  featured: boolean;
  sort_order: number;
  updated_at: string;
}

export interface DbCompanyInfo {
  id: number;
  name: LocalizedString;
  tagline: LocalizedString;
  description: LocalizedString;
  year_established: number;
  address: LocalizedString;
  phone: string;
  email: string;
  line_id: string | null;
  map_url: string;
  coordinates: { lat: number; lng: number };
  business_hours?: LocalizedString;
  stats?: Partial<CompanyStats>;
}

export interface DbService {
  slug: string;
  title: LocalizedString;
  short_description: LocalizedString;
  description: LocalizedString;
  icon: string;
  features: LocalizedString[];
  expertise: LocalizedString[];
  process_steps: ServiceStep[];
  meta_title: LocalizedString;
  meta_description: LocalizedString;
  is_primary: boolean;
  image_url: string | null;
  sort_order: number;
  updated_at: string;
}

export interface DbPageImage {
  key: string;
  image_url: string;
  updated_at: string;
}

export interface PageImage {
  key: string;
  imageUrl: string;
}
