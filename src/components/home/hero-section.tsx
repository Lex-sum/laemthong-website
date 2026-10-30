import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { ArrowRight, Phone } from "lucide-react";
import { HeroBackground } from "@/components/shared/hero-background";
import { HeroThemeSetter } from "@/components/shared/hero-theme-setter";
import { StatsStrip } from "@/components/home/stats-strip";
import { cn } from "@/lib/utils";
import type { CompanyStats } from "@/data/types";

type HeroSectionProps = {
  backgroundImage?: string;
  foundedYear: number;
  stats: CompanyStats;
};

export function HeroSection({ backgroundImage, foundedYear, stats }: HeroSectionProps) {
  const t = useTranslations("hero");
  const hasImage = !!backgroundImage;

  return (
    <section
      className={cn(
        "relative -mt-20 pt-20",
        hasImage ? "bg-foreground" : "bg-background"
      )}
    >
      <HeroThemeSetter isDark={hasImage} />
      <HeroBackground backgroundImage={backgroundImage} variant="home" />
      <div className="relative mx-auto max-w-7xl px-6 py-24 md:py-32 lg:py-40">
        {/* Label */}
        <p
          className={cn(
            "mb-6 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.3em]",
            hasImage ? "text-white/60" : "text-muted-foreground"
          )}
        >
          <span className="inline-block h-px w-8 bg-primary" />
          {`Since ${foundedYear}`}
        </p>

        {/* Heading */}
        <div className="relative max-w-4xl">
          <h1
            className={cn(
              "text-5xl font-bold leading-[1.1] tracking-tight md:text-6xl lg:text-7xl",
              hasImage ? "text-white" : "text-foreground"
            )}
          >
            {t("title")}
          </h1>
          {/* Red accent line */}
          <div className="mt-6 h-0.5 w-16 bg-primary" />
        </div>

        <p
          className={cn(
            "mt-6 max-w-xl text-lg leading-relaxed",
            hasImage ? "text-white/70" : "text-muted-foreground"
          )}
        >
          {t("subtitle")}
        </p>

        <div className="mt-10 flex flex-col items-start gap-4 sm:flex-row">
          <Button asChild size="lg" className="gap-2 px-8">
            <Link href="/products">
              {t("cta")}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button
            asChild
            variant="ghost"
            size="lg"
            className={cn(
              "gap-2",
              hasImage
                ? "text-white/80 hover:bg-white/10 hover:text-white"
                : "text-primary hover:text-primary"
            )}
          >
            <Link href="/contact">
              <Phone className="h-4 w-4" />
              {t("ctaSecondary")}
            </Link>
          </Button>
        </div>

        {/* Stats strip */}
        <StatsStrip hasImage={hasImage} stats={stats} />
      </div>
    </section>
  );
}
