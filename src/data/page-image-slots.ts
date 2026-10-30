import {
  Home,
  Info,
  Wrench,
  MessageSquare,
  Package,
  Building2,
  Phone,
  PanelTop,
  Palette,
  Globe,
} from "lucide-react";

export interface ImageSlot {
  key: string;
  label: string;
  hint: string;
  aspectRatio: number;
  aspectRatioLabel: string;
  recommendedPx?: string;
  maxPreviewWidth?: number;
  group?: "hero" | "content";
}

export interface TabSection {
  value: string;
  title: string;
  description: string;
  icon: typeof Home;
  slots: ImageSlot[];
}

// ── Branding slots (site-wide) ────────────────────────────────────

const BRANDING_SLOTS: ImageSlot[] = [
  {
    key: "site-logo",
    label: "Site Logo",
    hint: "Company logo displayed in the site header and footer. Replaces the default icon. Use a square image with transparent or white background.",
    aspectRatio: 1 / 1,
    aspectRatioLabel: "1:1 square",
    recommendedPx: "256 × 256 px",
  },
  {
    key: "site-favicon",
    label: "Favicon",
    hint: "Small icon shown in browser tabs and bookmarks.",
    aspectRatio: 1 / 1,
    aspectRatioLabel: "1:1 square",
    recommendedPx: "64 × 64 px",
    maxPreviewWidth: 96,
  },
];

// ── Slots grouped by destination page ──────────────────────────────

const HOME_SLOTS: ImageSlot[] = [
  {
    key: "home-hero",
    label: "Hero Background",
    hint: "Displayed behind the main heading on the homepage as a background image.",
    aspectRatio: 21 / 9,
    aspectRatioLabel: "21:9 ultrawide",
    recommendedPx: "1920 × 823 px",
  },
];

const ABOUT_SLOTS: ImageSlot[] = [
  {
    key: "hero-about",
    label: "Hero Background",
    hint: "Background image for the About page hero banner.",
    aspectRatio: 21 / 9,
    aspectRatioLabel: "21:9 ultrawide",
    recommendedPx: "1920 × 823 px",
    group: "hero",
  },
  {
    key: "about-history",
    label: "Company History",
    hint: "Shown alongside the company history text on the About page.",
    aspectRatio: 1 / 1,
    aspectRatioLabel: "1:1 square",
    recommendedPx: "600 × 600 px",
    group: "content",
  },
  {
    key: "about-reason1",
    label: "Why Choose Us — Card 1",
    hint: "First card image in the 'Why Choose Us' section.",
    aspectRatio: 4 / 3,
    aspectRatioLabel: "4:3 landscape",
    recommendedPx: "800 × 600 px",
    group: "content",
  },
  {
    key: "about-reason2",
    label: "Why Choose Us — Card 2",
    hint: "Second card image in the 'Why Choose Us' section.",
    aspectRatio: 4 / 3,
    aspectRatioLabel: "4:3 landscape",
    recommendedPx: "800 × 600 px",
    group: "content",
  },
  {
    key: "about-reason3",
    label: "Why Choose Us — Card 3",
    hint: "Third card image in the 'Why Choose Us' section.",
    aspectRatio: 4 / 3,
    aspectRatioLabel: "4:3 landscape",
    recommendedPx: "800 × 600 px",
    group: "content",
  },
  {
    key: "about-reason4",
    label: "Why Choose Us — Card 4",
    hint: "Fourth card image in the 'Why Choose Us' section.",
    aspectRatio: 4 / 3,
    aspectRatioLabel: "4:3 landscape",
    recommendedPx: "800 × 600 px",
    group: "content",
  },
];

const PRODUCTS_SLOTS: ImageSlot[] = [
  {
    key: "hero-products",
    label: "Hero Background",
    hint: "Background image for the Products page hero banner.",
    aspectRatio: 21 / 9,
    aspectRatioLabel: "21:9 ultrawide",
    recommendedPx: "1920 × 823 px",
  },
];

const BRANDS_SLOTS: ImageSlot[] = [
  {
    key: "hero-brands",
    label: "Hero Background",
    hint: "Background image for the Brands page hero banner.",
    aspectRatio: 21 / 9,
    aspectRatioLabel: "21:9 ultrawide",
    recommendedPx: "1920 × 823 px",
  },
];

const SERVICES_SLOTS: ImageSlot[] = [
  {
    key: "hero-services",
    label: "Hero Background",
    hint: "Background image for the Services listing page hero banner.",
    aspectRatio: 21 / 9,
    aspectRatioLabel: "21:9 ultrawide",
    recommendedPx: "1920 × 823 px",
    group: "hero",
  },
];

const CONTACT_SLOTS: ImageSlot[] = [
  {
    key: "hero-contact",
    label: "Hero Background",
    hint: "Background image for the Contact page hero banner.",
    aspectRatio: 21 / 9,
    aspectRatioLabel: "21:9 ultrawide",
    recommendedPx: "1920 × 823 px",
  },
];

// ── Tab configuration ──────────────────────────────────────────────

export const TABS: TabSection[] = [
  {
    value: "branding",
    title: "Site-wide",
    description: "Company logo and favicon used across the entire site.",
    icon: Palette,
    slots: BRANDING_SLOTS,
  },
  {
    value: "home",
    title: "Home",
    description: "Images displayed on the homepage.",
    icon: Home,
    slots: HOME_SLOTS,
  },
  {
    value: "about",
    title: "About",
    description: "Hero background and content images for the About page.",
    icon: Info,
    slots: ABOUT_SLOTS,
  },
  {
    value: "products",
    title: "Products",
    description: "Hero background for the Products page.",
    icon: Package,
    slots: PRODUCTS_SLOTS,
  },
  {
    value: "brands",
    title: "Brands",
    description: "Hero background for the Brands page.",
    icon: Building2,
    slots: BRANDS_SLOTS,
  },
  {
    value: "services",
    title: "Services",
    description: "Hero background for the Services page. Service images are set on each service (Services in the menu).",
    icon: Wrench,
    slots: SERVICES_SLOTS,
  },
  {
    value: "contact",
    title: "Contact",
    description: "Hero background for the Contact page.",
    icon: Phone,
    slots: CONTACT_SLOTS,
  },
];

export const SLOT_ICONS: Record<string, typeof MessageSquare> = {
  "site-logo": Palette,
  "site-favicon": Globe,
  "home-hero": PanelTop,
  "hero-about": PanelTop,
  "hero-products": PanelTop,
  "hero-brands": PanelTop,
  "hero-services": PanelTop,
  "hero-contact": PanelTop,
};
