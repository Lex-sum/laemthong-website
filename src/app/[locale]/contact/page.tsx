import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { ArrowRight } from "lucide-react";
import { ContactDetails } from "@/components/contact/contact-details";
import { GoogleMap } from "@/components/contact/google-map";
import { RequestQuoteButton } from "@/components/contact/quote-dialog";
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

export default async function ContactPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const loc = locale as Locale;
  const [t, tHome, tCommon, company, heroImage] = await Promise.all([
    getTranslations({ locale, namespace: "contact" }),
    getTranslations({ locale, namespace: "home" }),
    getTranslations({ locale, namespace: "common" }),
    getSiteCompany(),
    getPageImage("hero-contact"),
  ]);

  const hasMap = !!company.mapUrl || !!company.coordinates?.lat;

  return (
    <>
      <JsonLd data={buildLocalBusinessSchema(company, loc)} />
      <PageHero label={t("title")} title={t("title")} description={t("description")} backgroundImage={heroImage ?? undefined} />

      <section className="py-16 md:py-20">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 lg:grid-cols-5 lg:gap-12">
          {/* Details + quote — all values come from Admin → Company Info */}
          <div className={hasMap ? "lg:col-span-2" : "lg:col-span-5 lg:mx-auto lg:w-full lg:max-w-2xl"}>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              {t("companyInfo")}
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground">
              {company.name[loc]}
            </h2>
            <div className="mt-4 h-0.5 w-12 bg-primary" />

            <div className="mt-4">
              <ContactDetails
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
            </div>

            <div className="mt-8 rounded-lg bg-foreground p-6 text-background">
              <h3 className="text-lg font-semibold">{tHome("ctaTitle")}</h3>
              <p className="mt-2 text-sm leading-relaxed text-background/70">{tHome("ctaDesc")}</p>
              <RequestQuoteButton variant="accent" className="mt-5 gap-2">
                {tCommon("requestQuote")}
                <ArrowRight className="h-4 w-4" />
              </RequestQuoteButton>
            </div>
          </div>

          {hasMap && (
            <div className="lg:col-span-3">
              <GoogleMap
                mapUrl={company.mapUrl || undefined}
                coordinates={company.coordinates?.lat ? company.coordinates : undefined}
                title={company.name[loc]}
                className="h-80 lg:h-full lg:min-h-[520px]"
              />
            </div>
          )}
        </div>
      </section>
    </>
  );
}
