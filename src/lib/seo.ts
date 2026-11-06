import type {
  Locale,
  Product,
  Brand,
  Category,
  CompanyInfo,
} from "@/data/types";

// ─── Constants ────────────────────────────────────────────────

export const SITE_URL = "https://laemthong-website.vercel.app";
export const DEFAULT_OG_IMAGE = "/images/og-default.png";

export const SITE_NAME: Record<Locale, string> = {
  th: "แหลมทอง ซินดิเคท",
  en: "Laemthong Syndicate",
};

export const SITE_DESCRIPTION: Record<Locale, string> = {
  th: "ผู้นำเข้าและจัดจำหน่ายอุปกรณ์เชื่อมและตัดโลหะอุตสาหกรรมชั้นนำของประเทศไทย ประสบการณ์กว่า 60 ปี",
  en: "Thailand's leading importer and distributor of industrial welding and cutting equipment. Over 60 years of experience.",
};

// ─── URL Helpers ──────────────────────────────────────────────

export function getPageUrl(locale: Locale, path: string = ""): string {
  return `${SITE_URL}/${locale}${path}`;
}

/** hreflang links. Pass `{ en: false }` for pages with no English version (e.g. untranslated products). */
export function getAlternateLanguages(
  path: string,
  { en = true }: { en?: boolean } = {}
): Record<string, string> {
  return {
    th: `${SITE_URL}/th${path}`,
    ...(en ? { en: `${SITE_URL}/en${path}` } : {}),
    "x-default": `${SITE_URL}/th${path}`,
  };
}

// ─── Open Graph Locale Mapping ────────────────────────────────

export function getOgLocale(locale: Locale): string {
  return locale === "th" ? "th_TH" : "en_US";
}

export function getOgAlternateLocale(locale: Locale): string {
  return locale === "th" ? "en_US" : "th_TH";
}

// ─── JSON-LD Schema Builders ──────────────────────────────────

export function buildOrganizationSchema(
  company: CompanyInfo,
  locale: Locale,
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: company.name[locale],
    url: SITE_URL,
    logo: `${SITE_URL}/images/og-default.png`,
    description: company.description[locale],
    foundingDate: String(company.yearEstablished),
    address: {
      "@type": "PostalAddress",
      streetAddress: company.address[locale],
      addressLocality: locale === "th" ? "กรุงเทพมหานคร" : "Bangkok",
      addressCountry: "TH",
    },
    contactPoint: {
      "@type": "ContactPoint",
      telephone: company.phone,
      email: company.email,
      contactType: "sales",
      availableLanguage: ["Thai", "English"],
    },
  };
}

export function buildWebSiteSchema(
  locale: Locale,
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME[locale],
    url: getPageUrl(locale),
    description: SITE_DESCRIPTION[locale],
    inLanguage: locale === "th" ? "th-TH" : "en-US",
  };
}

export function buildLocalBusinessSchema(
  company: CompanyInfo,
  locale: Locale,
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${SITE_URL}/#localbusiness`,
    name: company.name[locale],
    description: company.description[locale],
    url: getPageUrl(locale, "/contact"),
    telephone: company.phone,
    email: company.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: company.address[locale],
      addressLocality: locale === "th" ? "กรุงเทพมหานคร" : "Bangkok",
      addressCountry: "TH",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: company.coordinates.lat,
      longitude: company.coordinates.lng,
    },
    openingHoursSpecification: {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ],
      opens: "08:00",
      closes: "17:00",
    },
    foundingDate: String(company.yearEstablished),
  };
}

export function buildProductSchema(
  product: Product,
  locale: Locale,
  brand?: Brand,
  category?: Category,
  specs: { name: string; value: string }[] = [],
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name[locale],
    description: product.description[locale],
    url: getPageUrl(locale, `/products/${product.slug}`),
    image: product.images[0]?.startsWith("http")
      ? product.images[0]
      : `${SITE_URL}${DEFAULT_OG_IMAGE}`,
    sku: product.slug,
    ...(brand && {
      brand: {
        "@type": "Brand",
        name: brand.name,
      },
    }),
    ...(category && {
      category: category.name[locale],
    }),
    ...(specs.length > 0 && {
      additionalProperty: specs.map((spec) => ({
        "@type": "PropertyValue",
        name: spec.name,
        value: spec.value,
      })),
    }),
  };
}

export function buildServiceSchema(
  serviceSlug: string,
  locale: Locale,
  title: string,
  description: string,
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: title,
    description,
    url: getPageUrl(locale, `/services/${serviceSlug}`),
    provider: {
      "@type": "Organization",
      name: SITE_NAME[locale],
      url: SITE_URL,
    },
    areaServed: {
      "@type": "Country",
      name: "Thailand",
    },
    availableChannel: {
      "@type": "ServiceChannel",
      serviceUrl: getPageUrl(locale, "/contact"),
    },
  };
}

export interface BreadcrumbItem {
  name: string;
  href: string;
}

export function buildBreadcrumbSchema(
  locale: Locale,
  items: BreadcrumbItem[],
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.href.startsWith("http")
        ? item.href
        : getPageUrl(locale, item.href),
    })),
  };
}
