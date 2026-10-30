"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { submitContactForm, type ContactFormState } from "@/app/[locale]/contact/actions";
import { CheckCircle2, Loader2, Package } from "lucide-react";
import { useEffect } from "react";
import { toast } from "sonner";

const categories = [
  { value: "welding-machines", label: { th: "เครื่องเชื่อม", en: "Welding Machines" } },
  { value: "cutting-equipment", label: { th: "อุปกรณ์ตัด", en: "Cutting Equipment" } },
  { value: "welding-accessories", label: { th: "อุปกรณ์เสริม", en: "Welding Accessories" } },
  { value: "welding-wire-rods", label: { th: "ลวดเชื่อม", en: "Welding Wires & Rods" } },
  { value: "gas-regulators", label: { th: "เกจ์แก๊ส", en: "Gas Regulators" } },
  { value: "safety-equipment", label: { th: "อุปกรณ์ความปลอดภัย", en: "Safety Equipment" } },
];

/** Product the visitor asked about (from the product page Request a Quote button). */
export type QuoteProduct = { slug: string; name: string };

type Props = {
  locale: string;
  product?: QuoteProduct;
  /** When set (popup), shows Cancel / Close buttons. */
  onClose?: () => void;
};

export function ContactForm({ locale, product, onClose }: Props) {
  const t = useTranslations("contact");
  const tCommon = useTranslations("common");
  const [state, formAction, isPending] = useActionState<ContactFormState, FormData>(
    submitContactForm,
    {}
  );

  useEffect(() => {
    if (state.success) {
      toast.success(t("successTitle"), {
        description: t("successMessage"),
      });
    }
  }, [state.success, t]);

  if (state.success) {
    return (
      <div className="rounded-xl border bg-card p-8 text-center" role="status" aria-live="polite">
        <CheckCircle2 className="mx-auto h-12 w-12 text-foreground" />
        <h3 className="mt-4 text-xl font-semibold text-foreground">
          {t("successTitle")}
        </h3>
        <p className="mt-2 text-muted-foreground">{t("successMessage")}</p>
        {onClose && (
          <Button className="mt-6" variant="outline" onClick={onClose}>
            {tCommon("close")}
          </Button>
        )}
      </div>
    );
  }

  return (
    <form action={formAction} className="relative space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">{t("name")} *</Label>
          <Input
            id="name"
            name="name"
            placeholder={t("namePlaceholder")}
            required
            aria-describedby={state.errors?.name ? "name-error" : undefined}
          />
          {state.errors?.name && (
            <p id="name-error" className="text-xs text-destructive">{state.errors.name[0]}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">{t("email")} *</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder={t("emailPlaceholder")}
            required
            aria-describedby={state.errors?.email ? "email-error" : undefined}
          />
          {state.errors?.email && (
            <p id="email-error" className="text-xs text-destructive">{state.errors.email[0]}</p>
          )}
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="company">{t("company")} *</Label>
          <Input
            id="company"
            name="company"
            placeholder={t("companyPlaceholder")}
            required
            aria-describedby={state.errors?.company ? "company-error" : undefined}
          />
          {state.errors?.company && (
            <p id="company-error" className="text-xs text-destructive">
              {state.errors.company[0]}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">{t("phone")}</Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            placeholder={t("phonePlaceholder")}
          />
        </div>
      </div>

      {/* Honeypot — hidden from humans, filled by bots */}
      <div aria-hidden="true" className="absolute -left-[9999px] -top-[9999px]">
        <label htmlFor="website">Website</label>
        <input type="text" id="website" name="website" tabIndex={-1} autoComplete="off" />
      </div>

      {product ? (
        // Quote for a specific product: send its name and code so the team knows what was asked about
        <div className="space-y-2">
          <Label>{t("productInterest")}</Label>
          <input type="hidden" name="productInterest" value={`${product.name} (${product.slug})`} />
          <div className="flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-2 text-sm">
            <Package className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="font-medium">{product.name}</span>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <Label htmlFor="productInterest">{t("productInterest")}</Label>
          <Select name="productInterest">
            <SelectTrigger id="productInterest">
              <SelectValue placeholder={t("productInterestPlaceholder")} />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label[locale as "th" | "en"]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="message">{t("message")} *</Label>
        <Textarea
          id="message"
          name="message"
          placeholder={t("messagePlaceholder")}
          rows={5}
          required
          aria-describedby={state.errors?.message ? "message-error" : undefined}
        />
        {state.errors?.message && (
          <p id="message-error" className="text-xs text-destructive">{state.errors.message[0]}</p>
        )}
      </div>

      <div className="flex flex-col-reverse gap-3 sm:flex-row">
        {onClose && (
          <Button type="button" variant="outline" size="lg" className="sm:flex-1" onClick={onClose} disabled={isPending}>
            {tCommon("cancel")}
          </Button>
        )}
        <Button type="submit" size="lg" className={onClose ? "sm:flex-[2]" : "w-full"} disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t("submitting")}
            </>
          ) : (
            t("submit")
          )}
        </Button>
      </div>
    </form>
  );
}
