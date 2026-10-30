import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { CheckCircle2 } from "lucide-react";
import { CtaContactSection } from "@/components/shared/cta-contact-section";
import { BreadcrumbBar } from "@/components/shared/breadcrumb-bar";
import { SectionHeading } from "@/components/shared/section-heading";
import { FadeImage } from "@/components/shared/fade-image";
import { PlaceholderImage } from "@/components/shared/placeholder-image";
import { JsonLd } from "@/components/shared/json-ld";
import { getPageImages } from "@/lib/db";
import { getAllServices, getServiceBySlug } from "@/lib/db/services";
import {
  getPageUrl,
  getAlternateLanguages,
  getOgLocale,
  getOgAlternateLocale,
  buildBreadcrumbSchema,
  buildServiceSchema,
} from "@/lib/seo";
import type { Locale } from "@/data/types";

export async function generateStaticParams() {
  const services = await getAllServices();
  return services.map((s) => ({ slug: s.slug }));
}

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const loc = locale as Locale;
  const service = await getServiceBySlug(slug);
  if (!service) return {};

  const title = service.metaTitle[loc] || service.title[loc];
  const description = service.metaDescription[loc] || service.shortDescription[loc];
  const pageUrl = getPageUrl(loc, `/services/${slug}`);

  return {
    title,
    description,
    alternates: {
      canonical: pageUrl,
      languages: getAlternateLanguages(`/services/${slug}`),
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

export default async function ServiceDetailPage({ params }: Props) {
  const { locale, slug } = await params;
  const service = await getServiceBySlug(slug);
  if (!service) notFound();

  setRequestLocale(locale);
  const loc = locale as Locale;
  const t = await getTranslations({ locale, namespace: "services" });
  const tNav = await getTranslations({ locale, namespace: "nav" });
  const tCommon = await getTranslations({ locale, namespace: "common" });

  const [pageImages, allServices] = await Promise.all([getPageImages(), getAllServices()]);
  // Service image from the services table; older page_images slots are a fallback
  const imageFor = (s: { slug: string; imageUrl: string | null }) =>
    s.imageUrl ?? pageImages.get(`service-${s.slug}`) ?? null;
  const serviceImage = imageFor(service);
  const title = service.title[loc];

  const features = service.features.map((f) => f[loc]);
  const processSteps = service.processSteps.map((step) => ({
    title: step.title[loc],
    description: step.description[loc],
  }));
  const expertise = service.expertise.map((e) => e[loc]);
  const otherServices = allServices.filter((s) => s.slug !== slug);

  return (
    <>
      <JsonLd
        data={buildServiceSchema(
          slug,
          loc,
          title,
          service.description[loc],
        )}
      />
      <JsonLd
        data={buildBreadcrumbSchema(loc, [
          { name: tNav("home"), href: "/" },
          { name: t("title"), href: "/services" },
          { name: title, href: `/services/${slug}` },
        ])}
      />

      <BreadcrumbBar items={[
        { label: tNav("home"), href: "/" },
        { label: t("title"), href: "/services" },
        { label: title },
      ]} />

      {/* Hero */}
      <section className="border-b py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-6">
          {/* Mobile image — above text on small screens */}
          <div className="mb-8 lg:hidden">
            <div className="overflow-hidden rounded-lg border">
              {serviceImage ? (
                <FadeImage
                  src={serviceImage}
                  alt={title}
                  width={800}
                  height={600}
                  className="aspect-[4/3] w-full object-cover"
                  sizes="100vw"
                  priority
                />
              ) : (
                <PlaceholderImage variant="service" aspect="aspect-[4/3]" />
              )}
            </div>
          </div>
          <div className="grid gap-10 lg:grid-cols-[1fr_480px] lg:items-center">
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl">
                {title}
              </h1>
              <p className="mt-6 max-w-3xl whitespace-pre-line text-lg leading-relaxed text-muted-foreground">
                {service.description[loc]}
              </p>
            </div>
            {/* Desktop image — side-by-side layout */}
            <div className="hidden lg:block">
              <div className="overflow-hidden rounded-lg border">
                {serviceImage ? (
                  <FadeImage
                    src={serviceImage}
                    alt={title}
                    width={600}
                    height={450}
                    className="aspect-[4/3] w-full object-cover"
                    sizes="480px"
                    priority
                  />
                ) : (
                  <PlaceholderImage variant="service" aspect="aspect-[4/3]" />
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features + Expertise */}
      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-12 lg:grid-cols-3">
            {/* Features - 2 cols */}
            <div className="lg:col-span-2">
              <SectionHeading title={t("keyFeatures")} align="left" />
              <div className="grid gap-4 sm:grid-cols-2">
                {features.map((feature, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 rounded-lg border bg-card p-4"
                  >
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <span className="text-sm leading-relaxed text-foreground">
                      {feature}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Expertise - 1 col */}
            <div>
              <SectionHeading title={t("areasOfExpertise")} align="left" />
              <div className="space-y-3">
                {expertise.map((item, i) => (
                  <div
                    key={i}
                    className="rounded-lg bg-muted px-4 py-3 text-sm font-medium text-foreground"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="border-y bg-muted/30 py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-6">
          <SectionHeading title={t("ourProcess")} />
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {processSteps.map((step, i) => (
              <div key={i} className="relative">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-foreground text-sm font-bold text-background">
                  {i + 1}
                </div>
                <h3 className="font-semibold text-foreground">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <CtaContactSection
        title={t("ctaTitle")}
        description={t("ctaDescription")}
        getInTouchLabel={tCommon("getInTouch")}
        buttonLabel={t("ctaButton")}
      />

      {/* Other Services */}
      <section className="border-t py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-6">
          <SectionHeading title={t("otherServices")} />
          <div className="grid gap-6 sm:grid-cols-3">
            {otherServices.map((other) => {
              const otherImage = imageFor(other);
              return (
                <Link
                  key={other.slug}
                  href={`/services/${other.slug}`}
                  className="group overflow-hidden rounded-lg border bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
                >
                  <div className="relative aspect-[4/3] overflow-hidden">
                    {otherImage ? (
                      <FadeImage
                        src={otherImage}
                        alt={other.title[loc]}
                        fill
                        className="object-cover transition-[opacity,transform] duration-300 group-hover:scale-105"
                        sizes="(max-width: 640px) 100vw, 33vw"
                      />
                    ) : (
                      <PlaceholderImage variant="service" aspect="aspect-[4/3]" />
                    )}
                  </div>
                  <div className="h-px w-full bg-border transition-colors duration-300 group-hover:bg-primary" />
                  <div className="p-4">
                    <h3 className="font-semibold text-foreground group-hover:text-primary">
                      {other.title[loc]}
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                      {other.shortDescription[loc]}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
