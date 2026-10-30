import { Link } from "@/i18n/navigation";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSiteCompany } from "@/lib/db/company";

type Props = {
  title: string;
  description: string;
  getInTouchLabel: string;
  buttonLabel: string;
};

export async function CtaContactSection({ title, description, getInTouchLabel, buttonLabel }: Props) {
  const company = await getSiteCompany();

  return (
    <section className="border-t py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground lg:text-4xl">
              {title}
            </h2>
            <p className="mt-4 max-w-md text-lg leading-relaxed text-muted-foreground">
              {description}
            </p>
          </div>
          <div className="rounded-lg bg-foreground p-8 text-background md:p-10">
            <p className="text-sm font-medium uppercase tracking-[0.15em] text-background/50">
              {getInTouchLabel}
            </p>
            <p className="mt-3 text-xl font-semibold text-background">
              {company.email}
            </p>
            <p className="mt-1 text-lg text-background/70">
              {company.phone}
            </p>
            <Button asChild variant="accent" size="lg" className="mt-6 gap-2">
              <Link href="/contact">
                {buttonLabel}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
