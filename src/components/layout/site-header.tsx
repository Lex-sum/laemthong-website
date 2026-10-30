"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { Logo } from "@/components/shared/logo";
import { LocaleSwitcher } from "@/components/shared/locale-switcher";
import { useHeaderTheme } from "@/components/layout/header-theme-context";
import { useScrolled } from "@/hooks/use-scrolled";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, ArrowRight } from "lucide-react";
import { RequestQuoteButton } from "@/components/contact/quote-dialog";
import { useState } from "react";
import { cn } from "@/lib/utils";

const navItems = [
  { key: "home", href: "/" },
  { key: "about", href: "/about" },
  { key: "products", href: "/products" },
  { key: "brands", href: "/brands" },
  { key: "services", href: "/services" },
  { key: "contact", href: "/contact" },
] as const;

export function SiteHeader({ logoUrl }: { logoUrl?: string | null }) {
  const t = useTranslations("nav");
  const tCommon = useTranslations("common");
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const scrolled = useScrolled();
  const { theme } = useHeaderTheme();
  const isDarkHero = theme === "dark" && !scrolled;

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 w-full transition-[background-color,border-color,box-shadow] duration-300",
        scrolled
          ? "border-b bg-background/80 shadow-sm backdrop-blur-xl"
          : "border-b border-transparent bg-transparent"
      )}
    >
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
        <Logo variant={isDarkHero ? "light" : "default"} imageUrl={logoUrl} />

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 lg:flex">
          {navItems.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.key}
                href={item.href}
                data-active={isActive}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "nav-underline py-1 text-sm font-medium transition-colors",
                  isActive
                    ? isDarkHero
                      ? "text-white"
                      : "text-foreground"
                    : isDarkHero
                      ? "text-white/70 hover:text-white"
                      : "text-muted-foreground hover:text-foreground"
                )}
              >
                {t(item.key)}
              </Link>
            );
          })}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-4">
          <LocaleSwitcher variant={isDarkHero ? "dark" : "default"} />
          <RequestQuoteButton
            className="hidden gap-2 sm:inline-flex"
            size="sm"
            variant={isDarkHero ? "accent" : "default"}
          >
            {tCommon("requestQuote")}
            <ArrowRight className="h-3.5 w-3.5" />
          </RequestQuoteButton>

          {/* Mobile menu */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "lg:hidden",
                  isDarkHero && "text-white hover:bg-white/10 hover:text-white"
                )}
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <nav className="mt-8 flex flex-col gap-1">
                {navItems.map((item) => {
                  const isActive =
                    item.href === "/"
                      ? pathname === "/"
                      : pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.key}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      aria-current={isActive ? "page" : undefined}
                      className={cn(
                        "border-l-2 px-4 py-2.5 text-sm font-medium transition-colors",
                        isActive
                          ? "border-primary text-foreground"
                          : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
                      )}
                    >
                      {t(item.key)}
                    </Link>
                  );
                })}
                <div className="mt-6 border-t pt-6 px-4">
                  <RequestQuoteButton className="w-full gap-2" onOpen={() => setOpen(false)}>
                    {tCommon("requestQuote")}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </RequestQuoteButton>
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
