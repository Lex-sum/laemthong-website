import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Logo } from "@/components/shared/logo";
import { Phone, Mail, MapPin, ShieldCheck, Award, Clock, MessageCircle } from "lucide-react";
import { getCachedCategories } from "@/lib/db/cached";
import { getSiteCompany, toTelHref } from "@/lib/db/company";
import type { Locale } from "@/data/types";

export async function SiteFooter({ locale, logoUrl }: { locale: string; logoUrl?: string | null }) {
  const t = await getTranslations({ locale, namespace: "footer" });
  const tNav = await getTranslations({ locale, namespace: "nav" });
  const tCommon = await getTranslations({ locale, namespace: "common" });
  const tContact = await getTranslations({ locale, namespace: "contact" });

  const [categories, company] = await Promise.all([getCachedCategories(), getSiteCompany()]);
  const footerCategories = categories.slice(0, 6);
  const loc = locale as Locale;

  const currentYear = new Date().getFullYear();

  return (
    <footer>
      {/* Top tier — white */}
      <div className="border-t bg-background">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
            {/* Company info */}
            <div className="lg:col-span-1">
              <Logo imageUrl={logoUrl} />
              <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
                {t("description")}
              </p>
            </div>

            {/* Quick links */}
            <div>
              <h3 className="mb-5 text-xs font-semibold uppercase tracking-[0.2em] text-foreground">
                {t("quickLinks")}
              </h3>
              <ul className="space-y-3">
                {(["about", "products", "brands", "services", "contact"] as const).map(
                  (key) => (
                    <li key={key}>
                      <Link
                        href={`/${key}`}
                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {tNav(key)}
                      </Link>
                    </li>
                  )
                )}
              </ul>
            </div>

            {/* Product categories */}
            {footerCategories.length > 0 && (
              <div>
                <h3 className="mb-5 text-xs font-semibold uppercase tracking-[0.2em] text-foreground">
                  {t("productCategories")}
                </h3>
                <ul className="space-y-3">
                  {footerCategories.map((cat) => (
                    <li key={cat.slug}>
                      <Link
                        href={{ pathname: "/products", query: { category: cat.slug } }}
                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {cat.name[loc]}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Contact info */}
            <div>
              <h3 className="mb-5 text-xs font-semibold uppercase tracking-[0.2em] text-foreground">
                {t("contactInfo")}
              </h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-2.5">
                  <Phone className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <a
                    href={toTelHref(company.phone)}
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    {company.phone}
                  </a>
                </li>
                <li className="flex items-start gap-2.5">
                  <Mail className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <a
                    href={`mailto:${company.email}`}
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    {company.email}
                  </a>
                </li>
                {company.lineId && (
                  <li className="flex items-start gap-2.5">
                    <MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">LINE: {company.lineId}</span>
                  </li>
                )}
                <li className="flex items-start gap-2.5">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {company.address[loc] || tContact("addressValue")}
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Red accent separator */}
      <div className="h-px bg-primary/30" />

      {/* Bottom tier — black */}
      <div className="bg-foreground text-background">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-6 py-5 sm:flex-row sm:justify-between">
          <p className="text-xs text-background/70">
            &copy; {currentYear} {tCommon("companyFullName")}. {t("allRightsReserved")}.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            <div className="flex items-center gap-1.5 rounded-md border border-background/20 bg-background/5 px-2.5 py-1 text-xs text-background/70">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>{t("authorizedDealer")}</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-md border border-background/20 bg-background/5 px-2.5 py-1 text-xs text-background/70">
              <Award className="h-3.5 w-3.5" />
              <span>{t("qualityAssured")}</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-md border border-background/20 bg-background/5 px-2.5 py-1 text-xs text-background/70">
              <Clock className="h-3.5 w-3.5" />
              <span>{t("trustedSince")}</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
