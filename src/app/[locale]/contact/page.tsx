import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { ContactForm } from "@/components/contact/contact-form";
import { ContactInfoStrip } from "@/components/contact/contact-info-strip";
import { GoogleMap } from "@/components/contact/google-map";
import { JsonLd } from "@/components/shared/json-ld";
import { PageHero } from "@/components/shared/page-hero";
import { getSiteCompany, getPageImage } from "@/lib/db";
import {
  getPageUrl,
  getAlternateLanguages,
  getOgLocale,
  getOgAlternateLocale,
  buildLocalBusinessSchema,
} from "@/lib/seo";
import type { Locale } from "@/data/types";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ product?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const loc = locale as Locale;
  const t = await getTranslations({ locale, namespace: "contact" });
  const title = t("title");
  const description = t("description");
  const pageUrl = getPageUrl(loc, "/contact");
  return {
    title,
    description,
    alternates: {
      canonical: pageUrl,
      languages: getAlternateLanguages("/contact"),
    },
    openGraph: {
      title,
      description,
      url: pageUrl,
      locale: getOgLocale(loc),
      alternateLocale: getOgAlternateLocale(loc),
      type: "website",
    },
    twitter: { title, description },
  };
}

export default async function ContactPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const { product } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "contact" });
  const loc = locale as Locale;
  const [company, heroImage] = await Promise.all([
    getSiteCompany(),
    getPageImage("hero-contact"),
  ]);

  return (
    <>
      <JsonLd data={buildLocalBusinessSchema(company, loc)} />
      <PageHero label={t("title")} title={t("title")} description={t("description")} backgroundImage={heroImage ?? undefined} />

      {/* Company info dark strip — all values come from Admin → Company Info */}
      <ContactInfoStrip
        phone={company.phone}
        email={company.email}
        lineId={company.lineId}
        address={company.address[loc] || t("addressValue")}
        hours={company.businessHours[loc] || t("businessHoursValue")}
        labels={{
          phone: t("phoneLabel"),
          email: t("emailLabel"),
          address: t("addressLabel"),
          hours: t("businessHours"),
        }}
      />

      {/* Form */}
      <section className="bg-muted/30 py-16 md:py-20">
        <div className="mx-auto max-w-4xl px-6">
          <div className="rounded-lg border bg-card p-8 shadow-sm">
            <h2 className="mb-6 text-2xl font-semibold text-foreground">
              {t("formTitle")}
            </h2>
            <ContactForm locale={locale} defaultProduct={product} />
          </div>
        </div>
      </section>

      {/* Map */}
      <section className="border-t py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-6">
          <GoogleMap
            mapUrl={company.mapUrl || undefined}
            coordinates={company.coordinates?.lat ? company.coordinates : undefined}
            title={company.name[loc]}
          />
        </div>
      </section>
    </>
  );
}
