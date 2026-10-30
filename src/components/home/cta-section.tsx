import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { AnimateOnScroll } from "@/components/shared/animate-on-scroll";

export function CtaSection({ email, phone }: { email: string; phone: string }) {
  const t = useTranslations("home");
  const tCommon = useTranslations("common");

  return (
    <section className="py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          {/* Left — text */}
          <AnimateOnScroll direction="left">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-foreground lg:text-4xl">
                {t("ctaTitle")}
              </h2>
              <p className="mt-4 max-w-md text-lg leading-relaxed text-muted-foreground">
                {t("ctaDesc")}
              </p>
            </div>
          </AnimateOnScroll>

          {/* Right — action card */}
          <AnimateOnScroll direction="right" delay={150}>
            <div className="rounded-lg bg-foreground p-8 text-background md:p-10">
              <p className="text-sm font-medium uppercase tracking-[0.15em] text-background/50">
                {tCommon("getInTouch")}
              </p>
              <p className="mt-3 text-xl font-semibold text-background">
                {email}
              </p>
              <p className="mt-1 text-lg text-background/70">
                {phone}
              </p>
              <Button asChild variant="accent" size="lg" className="mt-6 gap-2">
                <Link href="/contact">
                  {t("ctaButton")}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </AnimateOnScroll>
        </div>
      </div>
    </section>
  );
}
