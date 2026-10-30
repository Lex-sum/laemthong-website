/**
 * Website text that admins can edit at /admin/content.
 * Each key is a next-intl message path in messages/{th,en}.json — the file value
 * is the default, and a row in `site_content` overrides it (see src/lib/site-content.ts).
 * Sections match the tabs in src/data/page-image-slots.ts so text and images sit together.
 */
export interface ContentField {
  key: string;
  label: string;
  multiline?: boolean;
}

export interface ContentGroup {
  title: string;
  description?: string;
  fields: ContentField[];
}

const f = (key: string, label: string, multiline = false): ContentField => ({ key, label, multiline });

export const CONTENT_SECTIONS: Record<string, ContentGroup[]> = {
  branding: [
    {
      title: "Company name",
      fields: [f("common.companyName", "Short name"), f("common.companyFullName", "Full legal name")],
    },
    {
      title: "Menu",
      description: "Labels in the top navigation and footer links.",
      fields: [
        f("nav.home", "Home"),
        f("nav.about", "About"),
        f("nav.products", "Products"),
        f("nav.brands", "Brands"),
        f("nav.services", "Services"),
        f("nav.contact", "Contact"),
      ],
    },
    {
      title: "Footer",
      fields: [
        f("footer.description", "Company description", true),
        f("footer.authorizedDealer", "Badge 1"),
        f("footer.qualityAssured", "Badge 2"),
        f("footer.trustedSince", "Badge 3"),
      ],
    },
    {
      title: "Trust strip",
      description: "Three highlights shown on the Brands and Services pages.",
      fields: [
        f("trust.item1Title", "Item 1 title"),
        f("trust.item1Desc", "Item 1 text"),
        f("trust.item2Title", "Item 2 title"),
        f("trust.item2Desc", "Item 2 text"),
        f("trust.item3Title", "Item 3 title"),
        f("trust.item3Desc", "Item 3 text"),
      ],
    },
    {
      title: "Common buttons",
      fields: [
        f("common.requestQuote", "Request a quote"),
        f("common.contactUs", "Contact us"),
        f("common.getInTouch", "“Get in touch” label"),
      ],
    },
  ],

  home: [
    {
      title: "Hero",
      fields: [
        f("hero.title", "Headline", true),
        f("hero.subtitle", "Subheadline", true),
        f("hero.cta", "Main button"),
        f("hero.ctaSecondary", "Second button"),
        f("hero.statsYears", "Stat label: years"),
        f("hero.statsBrands", "Stat label: brands"),
        f("hero.statsProducts", "Stat label: products"),
        f("hero.statsClients", "Stat label: clients"),
      ],
    },
    {
      title: "Highlights",
      description: "Four selling points under the hero.",
      fields: [
        f("usp.experience", "Highlight 1"),
        f("usp.experienceDesc", "Highlight 1 text"),
        f("usp.directImporter", "Highlight 2"),
        f("usp.directImporterDesc", "Highlight 2 text"),
        f("usp.serviceTeam", "Highlight 3"),
        f("usp.serviceTeamDesc", "Highlight 3 text"),
        f("usp.authorized", "Highlight 4"),
        f("usp.authorizedDesc", "Highlight 4 text"),
      ],
    },
    {
      title: "Featured products & brands",
      fields: [
        f("home.featuredProducts", "Featured products heading"),
        f("home.featuredProductsDesc", "Featured products text"),
        f("home.ourBrands", "Brands heading"),
        f("home.ourBrandsDesc", "Brands text"),
      ],
    },
    {
      title: "Services section",
      fields: [
        f("home.servicesLabel", "Small label"),
        f("home.servicesTitle", "Heading"),
        f("home.servicesDesc", "Text", true),
        f("home.viewAllServices", "Button"),
      ],
    },
    {
      title: "Call to action",
      fields: [f("home.ctaTitle", "Heading"), f("home.ctaDesc", "Text", true), f("home.ctaButton", "Button")],
    },
  ],

  about: [
    {
      title: "Page header",
      fields: [f("about.title", "Title"), f("about.subtitle", "Subtitle", true)],
    },
    {
      title: "History",
      fields: [
        f("about.historyTitle", "Heading"),
        f("about.historyText1", "Paragraph 1", true),
        f("about.historyText2", "Paragraph 2", true),
        f("about.historyText3", "Paragraph 3", true),
      ],
    },
    {
      title: "Mission",
      fields: [f("about.missionTitle", "Heading"), f("about.missionText", "Text", true)],
    },
    {
      title: "Why choose us",
      fields: [
        f("about.whyChooseUs", "Heading"),
        ...[1, 2, 3, 4].flatMap((n) => [
          f(`about.reason${n}Title`, `Reason ${n} title`),
          f(`about.reason${n}Desc`, `Reason ${n} text`, true),
        ]),
      ],
    },
    {
      title: "Stats labels",
      description: "The numbers themselves are in Company Info.",
      fields: [
        f("about.statYearsExperience", "Years"),
        f("about.statGlobalBrands", "Brands"),
        f("about.statProducts", "Products"),
        f("about.statClients", "Clients"),
      ],
    },
    {
      title: "Our journey (timeline)",
      fields: [
        f("about.milestonesTitle", "Heading"),
        ...[1, 2, 3, 4, 5].flatMap((n) => [
          f(`about.milestone${n}Year`, `Milestone ${n} year`),
          f(`about.milestone${n}Title`, `Milestone ${n} title`),
          f(`about.milestone${n}Desc`, `Milestone ${n} text`, true),
        ]),
      ],
    },
  ],

  products: [
    {
      title: "Page header",
      fields: [f("products.title", "Title"), f("products.description", "Subtitle", true)],
    },
    {
      title: "No results message",
      fields: [f("products.noProductsLabel", "Heading"), f("products.noProductsDescription", "Text", true)],
    },
  ],

  brands: [
    {
      title: "Page header",
      fields: [f("brands.title", "Title"), f("brands.description", "Subtitle", true)],
    },
    {
      title: "Call to action",
      fields: [f("brands.ctaTitle", "Heading"), f("brands.ctaDescription", "Text", true), f("brands.ctaButton", "Button")],
    },
  ],

  services: [
    {
      title: "Page header",
      description: "Individual services are edited under Services in the menu.",
      fields: [
        f("services.title", "Title"),
        f("services.subtitle", "Subtitle", true),
        f("services.description", "SEO description", true),
      ],
    },
    {
      title: "Service groups",
      fields: [
        f("services.primaryTitle", "Core services heading"),
        f("services.primaryDescription", "Core services text", true),
        f("services.secondaryTitle", "Support services heading"),
        f("services.secondaryDescription", "Support services text", true),
      ],
    },
    {
      title: "Service detail page",
      fields: [
        f("services.keyFeatures", "Features heading"),
        f("services.areasOfExpertise", "Expertise heading"),
        f("services.ourProcess", "Process heading"),
        f("services.otherServices", "Other services heading"),
        f("services.viewDetails", "“View details” button"),
        f("services.backToServices", "Back link"),
      ],
    },
    {
      title: "Call to action",
      fields: [
        f("services.ctaTitle", "Heading"),
        f("services.ctaDescription", "Text", true),
        f("services.ctaButton", "Button"),
      ],
    },
  ],

  contact: [
    {
      title: "Page header",
      description: "Phone, email, address and hours are edited in Company Info.",
      fields: [f("contact.title", "Title"), f("contact.description", "Subtitle", true)],
    },
    {
      title: "Contact form",
      fields: [
        f("contact.formTitle", "Form heading"),
        f("contact.successTitle", "Success heading"),
        f("contact.successMessage", "Success message", true),
      ],
    },
  ],
};

/** All editable keys in a section (used to validate saves). */
export function contentKeysFor(section: string): Set<string> {
  return new Set((CONTENT_SECTIONS[section] ?? []).flatMap((g) => g.fields.map((fl) => fl.key)));
}
