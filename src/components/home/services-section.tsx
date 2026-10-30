import { FadeImage } from "@/components/shared/fade-image";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ArrowRight } from "lucide-react";
import { AnimateOnScroll } from "@/components/shared/animate-on-scroll";
import { PlaceholderImage } from "@/components/shared/placeholder-image";
import { STAGGER_DELAY } from "@/lib/constants";
import type { Locale, Service } from "@/data/types";

type Props = {
  services: Service[];
  pageImages: Map<string, string>;
};

export function ServicesSection({ services, pageImages }: Props) {
  const t = useTranslations("home");
  const locale = useLocale() as Locale;

  return (
    <section className="bg-foreground py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-6">
        {/* Section header */}
        <AnimateOnScroll>
          <p className="mb-3 flex items-center justify-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-background/50">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary" />
            {t("servicesLabel")}
          </p>
          <h2 className="text-center text-3xl font-bold tracking-tight text-background md:text-4xl">
            {t("servicesTitle")}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-background/60">
            {t("servicesDesc")}
          </p>
        </AnimateOnScroll>

        {/* Service cards grid */}
        <div className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
          {services.map((service, index) => {
            const serviceImage =
              service.imageUrl ?? pageImages.get(`service-${service.slug}`) ?? null;
            return (
              <AnimateOnScroll key={service.slug} delay={index * STAGGER_DELAY}>
                <Link href={`/services/${service.slug}`} className="group block">
                  <div className="overflow-hidden rounded-lg border border-background/10 transition-[border-color] duration-300 hover:border-primary/40">
                    {/* Image */}
                    <div className="relative aspect-[4/3] overflow-hidden">
                      {serviceImage ? (
                        <FadeImage
                          src={serviceImage}
                          alt={service.title[locale]}
                          fill
                          className="object-cover transition-[opacity,transform] duration-300 group-hover:scale-105"
                          sizes="(max-width: 768px) 50vw, 25vw"
                        />
                      ) : (
                        <PlaceholderImage variant="service" aspect="aspect-[4/3]" />
                      )}
                    </div>
                    {/* Red accent line */}
                    <div className="relative h-px w-full bg-background/10">
                      <div className="absolute left-0 top-0 h-full w-full origin-left scale-x-0 bg-primary transition-transform duration-300 group-hover:scale-x-100" />
                    </div>
                    {/* Text */}
                    <div className="p-4 md:p-5">
                      <h3 className="font-semibold text-background transition-colors group-hover:text-primary">
                        {service.title[locale]}
                      </h3>
                      <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-background/60">
                        {service.shortDescription[locale]}
                      </p>
                    </div>
                  </div>
                </Link>
              </AnimateOnScroll>
            );
          })}
        </div>

        {/* View all link */}
        <AnimateOnScroll delay={services.length * STAGGER_DELAY}>
          <div className="mt-10 text-center">
            <Link
              href="/services"
              className="inline-flex items-center gap-2 text-sm font-medium text-background/70 transition-colors hover:text-primary"
            >
              {t("viewAllServices")}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </AnimateOnScroll>
      </div>
    </section>
  );
}
