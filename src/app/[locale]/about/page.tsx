import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { FadeImage } from "@/components/shared/fade-image";
import { Building2 } from "lucide-react";
import { SectionHeading } from "@/components/shared/section-heading";
import { PlaceholderImage } from "@/components/shared/placeholder-image";
import { AnimateOnScroll } from "@/components/shared/animate-on-scroll";
import { STAGGER_DELAY } from "@/lib/constants";
import { PageHero } from "@/components/shared/page-hero";
import { JsonLd } from "@/components/shared/json-ld";
import {
  getPageUrl,
  getAlternateLanguages,
  getOgLocale,
  getOgAlternateLocale,
  buildOrganizationSchema,
  buildBreadcrumbSchema,
} from "@/lib/seo";
import { getPageImages, getSiteCompany } from "@/lib/db";
import type { Locale } from "@/data/types";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const loc = locale as Locale;
  const t = await getTranslations({ locale, namespace: "about" });
  const title = t("title");
  const description = t("subtitle");
  const pageUrl = getPageUrl(loc, "/about");
  return {
    title,
    description,
    alternates: {
      canonical: pageUrl,
      languages: getAlternateLanguages("/about"),
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

export default async function AboutPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const loc = locale as Locale;
  const [t, pageImages, company] = await Promise.all([
    getTranslations({ locale, namespace: "about" }),
    getPageImages(),
    getSiteCompany(),
  ]);
  const tNav = await getTranslations({ locale, namespace: "nav" });

  const historyImage = pageImages.get("about-history") ?? null;

  const reasons = [
    { key: "reason1", image: pageImages.get("about-reason1") ?? null },
    { key: "reason2", image: pageImages.get("about-reason2") ?? null },
    { key: "reason3", image: pageImages.get("about-reason3") ?? null },
    { key: "reason4", image: pageImages.get("about-reason4") ?? null },
  ];

  const milestones = [
    { yearKey: "milestone1Year", titleKey: "milestone1Title", descKey: "milestone1Desc" },
    { yearKey: "milestone2Year", titleKey: "milestone2Title", descKey: "milestone2Desc" },
    { yearKey: "milestone3Year", titleKey: "milestone3Title", descKey: "milestone3Desc" },
    { yearKey: "milestone4Year", titleKey: "milestone4Title", descKey: "milestone4Desc" },
    { yearKey: "milestone5Year", titleKey: "milestone5Title", descKey: "milestone5Desc" },
  ] as const;

  return (
    <>
      <JsonLd data={buildOrganizationSchema(company, loc)} />
      <JsonLd
        data={buildBreadcrumbSchema(loc, [
          { name: tNav("home"), href: "/" },
          { name: t("title"), href: "/about" },
        ])}
      />

      <PageHero label={t("title")} title={t("title")} description={t("subtitle")} backgroundImage={pageImages.get("hero-about") ?? undefined} />

      {/* History */}
      <section className="py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-16 lg:grid-cols-2">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-foreground lg:text-4xl">
                {t("historyTitle")}
              </h2>
              <div className="mt-1 h-0.5 w-12 bg-primary" />
              <div className="mt-6 space-y-4">
                <p className="leading-relaxed text-muted-foreground">
                  {t("historyText1")}
                </p>
                <p className="leading-relaxed text-muted-foreground">
                  {t("historyText2")}
                </p>
                <p className="leading-relaxed text-muted-foreground">
                  {t("historyText3")}
                </p>
              </div>
            </div>
            <div className="overflow-hidden rounded-lg">
              {historyImage ? (
                <FadeImage
                  src={historyImage}
                  alt={t("historyTitle")}
                  width={600}
                  height={600}
                  className="aspect-square w-full object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              ) : (
                <PlaceholderImage
                  variant="about"
                  aspect="aspect-square"
                />
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Strip */}
      <section className="bg-foreground text-background">
        <div className="mx-auto max-w-7xl px-6 py-10 md:py-14">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {[
              { value: `${company.stats.years}+`, label: t("statYearsExperience") },
              { value: `${company.stats.brands}+`, label: t("statGlobalBrands") },
              { value: `${company.stats.products.toLocaleString()}+`, label: t("statProducts") },
              { value: `${company.stats.clients.toLocaleString()}+`, label: t("statClients") },
            ].map((stat, i) => (
              <AnimateOnScroll key={stat.label} delay={i * STAGGER_DELAY}>
                <div>
                  <div className="text-3xl font-light tracking-tight text-background md:text-4xl">{stat.value}</div>
                  <div className="mt-1 text-xs font-medium uppercase tracking-[0.2em] text-background/50">
                    {stat.label}
                  </div>
                  <div className="mt-3 h-px w-8 bg-primary" />
                </div>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* Milestones */}
      <section className="border-y bg-muted/30 py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-6">
          <SectionHeading title={t("milestonesTitle")} label="Timeline" align="center" />
          <div className="relative">
            <div className="absolute left-0 right-0 top-5 hidden h-px bg-border lg:block" />
            <div className="grid gap-10 md:grid-cols-3 lg:grid-cols-5">
              {milestones.map((m, i) => (
                <AnimateOnScroll key={m.yearKey} delay={i * 150}>
                  <div className="relative text-center">
                    <div className="relative mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-foreground text-sm font-medium text-background">
                      {t(m.yearKey)}
                    </div>
                    <h3 className="font-semibold text-foreground">
                      {t(m.titleKey)}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {t(m.descKey)}
                    </p>
                  </div>
                </AnimateOnScroll>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="bg-foreground py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-6 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-lg border border-background/20">
            <Building2 className="h-7 w-7 text-background" />
          </div>
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-background lg:text-4xl">
            {t("missionTitle")}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-background/70">
            {t("missionText")}
          </p>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="border-t py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-6">
          <SectionHeading title={t("whyChooseUs")} label="Our Strengths" />
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {reasons.map(({ key, image }, i) => (
              <AnimateOnScroll key={key} delay={i * STAGGER_DELAY}>
                <div className="group">
                  <div className="mb-4 overflow-hidden rounded-lg border transition-colors group-hover:border-primary">
                    {image ? (
                      <FadeImage
                        src={image}
                        alt={t(`${key}Title`)}
                        width={400}
                        height={300}
                        className="aspect-[4/3] w-full object-cover transition-[opacity,transform] duration-300 group-hover:scale-105"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      />
                    ) : (
                      <PlaceholderImage
                        variant="about"
                        aspect="aspect-[4/3]"
                        className="transition-transform duration-300 group-hover:scale-105"
                      />
                    )}
                  </div>
                  <h3 className="font-semibold text-foreground">
                    {t(`${key}Title`)}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {t(`${key}Desc`)}
                  </p>
                </div>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
