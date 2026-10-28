"use client";

import { useEffect } from "react";
import useEmblaCarousel from "embla-carousel-react";
import AutoScroll from "embla-carousel-auto-scroll";
import { FadeImage } from "@/components/shared/fade-image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { AnimateOnScroll } from "@/components/shared/animate-on-scroll";
import type { Brand } from "@/data/types";

type Props = {
  brands: Brand[];
};

export function BrandShowcase({ brands }: Props) {
  const t = useTranslations("home");

  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      loop: true,
      align: "start",
      dragFree: true,
    },
    [AutoScroll({ speed: 1, startDelay: 0 })]
  );

  useEffect(() => {
    if (!emblaApi) return;

    // Respect prefers-reduced-motion
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) {
      emblaApi.plugins().autoScroll?.stop();
    }

    // Resume auto-scroll after user drag/swipe ends
    const onSettle = () => {
      if (mq.matches) return;
      const autoScroll = emblaApi.plugins().autoScroll;
      if (autoScroll && !autoScroll.isPlaying()) {
        autoScroll.play(0);
      }
    };

    emblaApi.on("settle", onSettle);
    return () => {
      emblaApi.off("settle", onSettle);
    };
  }, [emblaApi]);

  if (brands.length === 0) return null;

  const duplicated = [...brands, ...brands];

  return (
    <section className="border-y py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-6">
        <AnimateOnScroll>
          <p className="text-center text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            {t("ourBrands")}
          </p>
        </AnimateOnScroll>
      </div>

      <div className="relative mt-10">
        <div
          className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-background to-transparent md:w-24"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-background to-transparent md:w-24"
          aria-hidden="true"
        />

        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex">
            {duplicated.map((brand, i) => (
              <div
                key={`${brand.slug}-${i}`}
                className="min-w-0 shrink-0 basis-1/3 pl-6 sm:basis-1/4 md:basis-1/5 md:pl-8 lg:basis-1/6"
              >
                <Link
                  href={{
                    pathname: "/products",
                    query: { brand: brand.slug },
                  }}
                  className="flex flex-col items-center gap-3"
                >
                  <div className="relative flex h-16 w-24 items-center justify-center md:h-20 md:w-32">
                    {brand.logo?.startsWith("http") ? (
                      <FadeImage
                        src={brand.logo}
                        alt={brand.name}
                        fill
                        sizes="128px"
                        className="object-contain"
                        quality={85}
                      />
                    ) : (
                      <span className="text-2xl font-bold text-foreground">
                        {brand.name}
                      </span>
                    )}
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6">
        <AnimateOnScroll delay={200}>
          <p className="mt-10 text-center text-sm text-muted-foreground">
            {t("ourBrandsDesc")}
          </p>
        </AnimateOnScroll>
      </div>
    </section>
  );
}
