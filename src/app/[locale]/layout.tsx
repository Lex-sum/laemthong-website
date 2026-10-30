import type { ReactNode } from "react";
import type { Metadata } from "next";
import { IBM_Plex_Sans_Thai } from "next/font/google";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { NextIntlClientProvider } from "next-intl";
import { routing } from "@/i18n/routing";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { QuoteDialogProvider } from "@/components/contact/quote-dialog";
import { HeaderThemeProvider } from "@/components/layout/header-theme-context";
import { Toaster } from "@/components/ui/sonner";
import { getPageImage } from "@/lib/db";
import "../globals.css";

const font = IBM_Plex_Sans_Thai({
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://laemthong-website.vercel.app"),
  title: {
    template: "%s | Laemthong Syndicate",
    default: "Laemthong Syndicate - Industrial Welding Equipment Supplier",
  },
  description:
    "Thailand's leading importer and distributor of industrial welding and cutting equipment. Over 60 years of experience. Lincoln Electric, Harris, CEA authorized dealer.",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    siteName: "Laemthong Syndicate",
    images: [
      {
        url: "/images/og-default.png",
        width: 1200,
        height: 630,
        alt: "Laemthong Syndicate - Industrial Welding Equipment",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/images/og-default.png"],
  },
  icons: {
    icon: "/api/favicon",
  },
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

type Props = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  // getMessages() returns the request config messages, including admin-edited text
  const [messages, logoUrl] = await Promise.all([
    getMessages({ locale }),
    getPageImage("site-logo"),
  ]);

  return (
    <html lang={locale} suppressHydrationWarning>
      <head />
      <body className={`${font.variable} font-sans antialiased`}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <QuoteDialogProvider locale={locale}>
            <HeaderThemeProvider>
              <div className="flex min-h-screen flex-col">
                <a
                  href="#main"
                  className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-md focus:bg-background focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-foreground focus:shadow-lg focus:ring-2 focus:ring-primary"
                >
                  Skip to content
                </a>
                <SiteHeader logoUrl={logoUrl} />
                <main id="main" className="flex-1 pt-20">{children}</main>
                <SiteFooter locale={locale} logoUrl={logoUrl} />
              </div>
            </HeaderThemeProvider>
          </QuoteDialogProvider>
          <Toaster />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
