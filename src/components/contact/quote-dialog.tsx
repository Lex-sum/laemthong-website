"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ContactForm, type QuoteProduct } from "@/components/contact/contact-form";

type QuoteDialogContextValue = {
  /** Opens the quote form, optionally about a specific product. */
  openQuote: (product?: QuoteProduct) => void;
};

const QuoteDialogContext = createContext<QuoteDialogContextValue | null>(null);

export function useQuoteDialog(): QuoteDialogContextValue {
  const ctx = useContext(QuoteDialogContext);
  if (!ctx) throw new Error("useQuoteDialog must be used inside QuoteDialogProvider");
  return ctx;
}

/** One site-wide "Request a Quote" popup. Mounted once in the locale layout. */
export function QuoteDialogProvider({ locale, children }: { locale: string; children: ReactNode }) {
  const t = useTranslations("contact");
  const [open, setOpen] = useState(false);
  const [product, setProduct] = useState<QuoteProduct | undefined>();
  // A new key per opening gives a fresh, empty form every time
  const [formKey, setFormKey] = useState(0);

  const openQuote = useCallback((next?: QuoteProduct) => {
    setProduct(next);
    setFormKey((k) => k + 1);
    setOpen(true);
  }, []);

  const value = useMemo(() => ({ openQuote }), [openQuote]);

  return (
    <QuoteDialogContext.Provider value={value}>
      {children}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="max-h-[90vh] overflow-y-auto sm:max-w-xl"
          // Clicking the backdrop shouldn't throw away a half-written message;
          // close with the X, Cancel or Esc instead.
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>{t("formTitle")}</DialogTitle>
            <DialogDescription>{t("description")}</DialogDescription>
          </DialogHeader>
          <ContactForm
            key={formKey}
            locale={locale}
            product={product}
            onClose={() => setOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </QuoteDialogContext.Provider>
  );
}

/** Button that opens the quote popup. Usable from server components. */
export function RequestQuoteButton({
  product,
  children,
  onOpen,
  ...buttonProps
}: Omit<React.ComponentProps<typeof Button>, "onClick" | "asChild"> & {
  product?: QuoteProduct;
  /** Runs before opening, e.g. to close the mobile menu. */
  onOpen?: () => void;
}) {
  const { openQuote } = useQuoteDialog();
  return (
    <Button
      type="button"
      {...buttonProps}
      onClick={() => {
        onOpen?.();
        openQuote(product);
      }}
    >
      {children}
    </Button>
  );
}
