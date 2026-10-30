import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { setRequestLocale } from "next-intl/server";
import { HeroSection } from "@/components/home/hero-section";
import { UspSection } from "@/components/home/usp-section";
import { FeaturedProducts } from "@/components/home/featured-products";
import { CtaSection } from "@/components/home/cta-section";
import { ServicesSection } from "@/components/home/services-section";
import { JsonLd } from "@/components/shared/json-ld";
import { getFeaturedProducts, getAllBrands, getSiteCompany, getPageImage, getPageImages } from "@/lib/db";

const BrandShowcase = dynamic(
  () => import("@/components/home/brand-showcase").then((m) => m.BrandShowcase),
);
import {
  getPageUrl,
  getAlternateLanguages,
  getOgLocale,
  getOgAlternateLocale,
  SITE_NAME,
  SITE_DESCRIPTION,
  buildOrganizationSchema,
  buildWebSiteSchema,
  buildLocalBusinessSchema,
} from "@/lib/seo";
import type { Locale } from "@/data/types";

export const revalidate = 3600;

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const loc = locale as Locale;
  return {
    title: SITE_NAME[loc],
    description: SITE_DESCRIPTION[loc],
    alternates: {
      canonical: getPageUrl(loc),
      languages: getAlternateLanguages(""),
    },
    openGraph: {
      title: SITE_NAME[loc],
      description: SITE_DESCRIPTION[loc],
      url: getPageUrl(loc),
      locale: getOgLocale(loc),
      alternateLocale: getOgAlternateLocale(loc),
      type: "website",
    },
    twitter: {
      title: SITE_NAME[loc],
      description: SITE_DESCRIPTION[loc],
    },
  };
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [featuredProducts, brands, company, heroImage, pageImages] = await Promise.all([
    getFeaturedProducts(),
    getAllBrands(),
    getSiteCompany(),
    getPageImage("home-hero"),
    getPageImages(),
  ]);

  return (
    <>
      <JsonLd data={buildOrganizationSchema(company, locale as Locale)} />
      <JsonLd data={buildLocalBusinessSchema(company, locale as Locale)} />
      <JsonLd data={buildWebSiteSchema(locale as Locale)} />
      <HeroSection
        backgroundImage={heroImage ?? undefined}
        foundedYear={company.yearEstablished}
        stats={company.stats}
      />
      <UspSection />
      <FeaturedProducts products={featuredProducts} />
      <BrandShowcase brands={brands} />
      <ServicesSection pageImages={pageImages} />
      <CtaSection email={company.email} phone={company.phone} />
    </>
  );
}
