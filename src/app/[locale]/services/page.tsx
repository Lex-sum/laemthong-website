import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { FadeImage } from "@/components/shared/fade-image";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { CtaContactSection } from "@/components/shared/cta-contact-section";
import { TrustStrip } from "@/components/shared/trust-strip";
import { JsonLd } from "@/components/shared/json-ld";
import { AnimateOnScroll } from "@/components/shared/animate-on-scroll";
import { PageHero } from "@/components/shared/page-hero";
import { PlaceholderImage } from "@/components/shared/placeholder-image";
import { getPageImages } from "@/lib/db";
import { getAllServices } from "@/lib/db/services";
import { STAGGER_DELAY } from "@/lib/constants";
import {
  getPageUrl,
  getAlternateLanguages,
  getOgLocale,
  getOgAlternateLocale,
  buildBreadcrumbSchema,
} from "@/lib/seo";
import type { Locale } from "@/data/types";

export const revalidate = 3600;

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const loc = locale as Locale;
  const t = await getTranslations({ locale, namespace: "services" });
  const title = t("title");
  const description = t("description");
  const pageUrl = getPageUrl(loc, "/services");
  return {
    title,
    description,
    alternates: {
      canonical: pageUrl,
      languages: getAlternateLanguages("/services"),
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

export default async function ServicesPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const loc = locale as Locale;
  const t = await getTranslations({ locale, namespace: "services" });
  const tTrust = await getTranslations({ locale, namespace: "trust" });
  const tNav = await getTranslations({ locale, namespace: "nav" });
  const tCommon = await getTranslations({ locale, namespace: "common" });
  const [pageImages, services] = await Promise.all([getPageImages(), getAllServices()]);
  const heroImage = pageImages.get("hero-services") ?? undefined;

  return (
    <>
      <JsonLd
        data={buildBreadcrumbSchema(loc, [
          { name: tNav("home"), href: "/" },
          { name: t("title"), href: "/services" },
        ])}
      />

      <PageHero label={t("title")} title={t("title")} description={t("subtitle")} backgroundImage={heroImage ?? undefined} />

      {/* All Services */}
      <section className="bg-muted/30 py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-8 md:grid-cols-2">
            {services.map((service, index) => {
              const serviceImage =
                service.imageUrl ?? pageImages.get(`service-${service.slug}`) ?? null;
              const features = service.features.map((f) => f[loc]);
              return (
                <AnimateOnScroll
                  key={service.slug}
                  direction="up"
                  delay={index * STAGGER_DELAY}
                >
                  <Link href={`/services/${service.slug}`} className="group h-full">
                    <div className="h-full overflow-hidden rounded-lg border bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg">
                      {/* Service image */}
                      <div className="relative aspect-[4/3] overflow-hidden">
                        {serviceImage ? (
                          <FadeImage
                            src={serviceImage}
                            alt={service.title[loc]}
                            fill
                            className="object-cover transition-[opacity,transform] duration-300 group-hover:scale-105"
                            sizes="(max-width: 768px) 100vw, 50vw"
                          />
                        ) : (
                          <PlaceholderImage variant="service" aspect="aspect-[4/3]" />
                        )}
                      </div>
                      {/* Red accent divider */}
                      <div className="h-px w-full bg-border transition-colors duration-300 group-hover:bg-primary" />
                      {/* Content */}
                      <div className="p-6 md:p-8">
                        <h2 className="text-xl font-bold text-foreground md:text-2xl">
                          {service.title[loc]}
                        </h2>
                        <p className="mt-3 leading-relaxed text-muted-foreground">
                          {service.shortDescription[loc]}
                        </p>
                        <ul className="mt-5 space-y-2">
                          {features.slice(0, 4).map((feature, i) => (
                            <li
                              key={i}
                              className="flex items-start gap-2 text-sm"
                            >
                              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                              <span className="text-muted-foreground">
                                {feature}
                              </span>
                            </li>
                          ))}
                        </ul>
                        <span className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-foreground transition-colors group-hover:text-primary">
                          {t("viewDetails")}
                          <ArrowRight className="h-4 w-4" />
                        </span>
                      </div>
                    </div>
                  </Link>
                </AnimateOnScroll>
              );
            })}
          </div>
        </div>
      </section>

      <TrustStrip items={[
        { title: tTrust("item1Title"), description: tTrust("item1Desc") },
        { title: tTrust("item2Title"), description: tTrust("item2Desc") },
        { title: tTrust("item3Title"), description: tTrust("item3Desc") },
      ]} />

      <CtaContactSection
        title={t("ctaTitle")}
        description={t("ctaDescription")}
        getInTouchLabel={tCommon("getInTouch")}
        buttonLabel={t("ctaButton")}
      />
    </>
  );
}
