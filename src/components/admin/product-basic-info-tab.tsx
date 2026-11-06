"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import Link from "next/link";
import { Plus } from "lucide-react";
import { SlugInput } from "./slug-input";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BilingualInput } from "./bilingual-input";
import { BilingualTextarea } from "./bilingual-textarea";
import { QuickCreateBrandDialog } from "./quick-create-brand-dialog";
import { SapStockPanel } from "./sap-stock-panel";
import Image from "next/image";
import type { DbBrand, DbCategory } from "@/data/types";
import type { SapProductInfo } from "@/lib/db/admin";

interface ProductBasicInfoTabProps {
  product?: {
    name: { th: string; en: string };
    short_description: { th: string; en: string };
    slug: string;
  };
  /** Pre-fills both TH and EN short description for new products (still editable). */
  defaultShortDescription?: string;
  /** SAP B1 stock for this slug; omit to hide the panel. */
  sapInfo?: SapProductInfo;
  isEditing: boolean;
  slug: string;
  onSlugChange: (slug: string) => void;
  isCustomSlug: boolean;
  onToggleCustomSlug: (custom: boolean) => void;
  handleNameChange: (name: string) => void;
  categorySlug: string;
  onCategorySlugChange: (slug: string) => void;
  brandSlug: string;
  onBrandSlugChange: (slug: string) => void;
  featured: boolean;
  onFeaturedChange: (featured: boolean) => void;
  categories: DbCategory[];
  brands: DbBrand[];
  errors?: Record<string, string[]>;
}

export function ProductBasicInfoTab({
  product,
  defaultShortDescription,
  sapInfo,
  isEditing,
  slug,
  onSlugChange,
  isCustomSlug,
  onToggleCustomSlug,
  handleNameChange,
  categorySlug,
  onCategorySlugChange,
  brandSlug,
  onBrandSlugChange,
  featured,
  onFeaturedChange,
  categories,
  brands: initialBrands,
  errors,
}: ProductBasicInfoTabProps) {
  const [brandsList, setBrandsList] = useState(initialBrands);
  const [brandDialogOpen, setBrandDialogOpen] = useState(false);

  const mains = categories.filter((c) => !c.parent_slug);
  const subsOf = (slug: string) => categories.filter((c) => c.parent_slug === slug);
  const selectedCategory = categories.find((c) => c.slug === categorySlug);
  const needsSub = !!selectedCategory && !selectedCategory.parent_slug && subsOf(selectedCategory.slug).length > 0;
  const categoryLabel = (slug: string) => {
    const c = categories.find((x) => x.slug === slug);
    if (!c) return null;
    const parent = c.parent_slug ? categories.find((x) => x.slug === c.parent_slug) : undefined;
    return parent ? `${parent.name.th} › ${c.name.th}` : c.name.th;
  };

  return (
    <div className="space-y-6">
      <BilingualInput
        label="Product Name"
        nameTh="nameTh"
        nameEn="nameEn"
        defaultValueTh={product?.name.th}
        defaultValueEn={product?.name.en}
        required
        optionalEn
        errorTh={errors?.nameTh?.[0]}
        errorEn={errors?.nameEn?.[0]}
        onChangeEn={handleNameChange}
        helperText="Thai is required. English is optional — without it the English site shows the Thai text and keeps the page out of Google until translated."
      />

      {isEditing && product ? (
        // The slug is fixed after creation: it is the SAP item code, the page URL
        // and the image folder name.
        <div className="space-y-2">
          <Label htmlFor="slug-locked">Slug</Label>
          <Input id="slug-locked" value={product.slug} readOnly disabled className="bg-muted font-mono" />
          <p className="text-xs text-muted-foreground">
            The slug can&apos;t be changed after the product is created. To fix a typo, delete and
            recreate the product.
          </p>
          {errors?.slug?.[0] && <p className="text-sm text-destructive">{errors.slug[0]}</p>}
        </div>
      ) : (
        <SlugInput
          isCustomSlug={isCustomSlug}
          onToggleCustom={onToggleCustomSlug}
          slug={slug}
          onSlugChange={onSlugChange}
          tooltipText='The URL-friendly version of the name, used in the page address (/products/your-slug). Use the SAP item code for products sold from SAP. Auto-filled from the English name — if there is no English name, type the slug yourself. It cannot be changed after the product is created.'
          error={errors?.slug?.[0]}
        />
      )}

      {sapInfo && <SapStockPanel info={sapInfo} />}

      <BilingualTextarea
        label="Short Description"
        nameTh="shortDescriptionTh"
        nameEn="shortDescriptionEn"
        defaultValueTh={product?.short_description.th ?? defaultShortDescription}
        defaultValueEn={product?.short_description.en ?? defaultShortDescription}
        required
        optionalEn
        rows={2}
        errorTh={errors?.shortDescriptionTh?.[0]}
        errorEn={errors?.shortDescriptionEn?.[0]}
        helperText="Brief summary shown in product cards (1-2 sentences). Thai is required, English optional."
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Category *</Label>
          <Select value={categorySlug} onValueChange={onCategorySlugChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select category">{categorySlug && categoryLabel(categorySlug)}</SelectValue>
            </SelectTrigger>
            <SelectContent position="popper" className="max-h-80">
              {mains.map((main) => {
                const subs = subsOf(main.slug);
                return subs.length === 0 ? (
                  <SelectItem key={main.slug} value={main.slug}>
                    {main.name.th}
                  </SelectItem>
                ) : (
                  <SelectGroup key={main.slug}>
                    <SelectLabel>{main.name.th}</SelectLabel>
                    {subs.map((sub) => (
                      <SelectItem key={sub.slug} value={sub.slug} className="pl-6">
                        {sub.name.th}
                      </SelectItem>
                    ))}
                    {main.slug === categorySlug && (
                      // A product still sitting on the main category (e.g. moved from an old category)
                      <SelectItem value={main.slug} className="pl-6 text-muted-foreground">
                        {main.name.th} (no sub category)
                      </SelectItem>
                    )}
                    <SelectSeparator />
                  </SelectGroup>
                );
              })}
            </SelectContent>
          </Select>
          {errors?.categorySlug && (
            <p className="text-xs text-destructive">
              {errors.categorySlug[0]}
            </p>
          )}
          {needsSub ? (
            <p className="text-xs text-amber-600">Choose a sub category so the product gets all of its specs.</p>
          ) : (
            <p className="text-xs text-muted-foreground">
              The category decides the product&apos;s specs.{" "}
              <Link href="/admin/categories" target="_blank" className="text-primary hover:underline">
                Manage categories →
              </Link>
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label>Brand *</Label>
          <Select
            value={brandSlug}
            onValueChange={(val) => {
              if (val === "__create_new__") {
                setBrandDialogOpen(true);
              } else {
                onBrandSlugChange(val);
              }
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select brand">
                {brandSlug && (() => {
                  const brand = brandsList.find(b => b.slug === brandSlug);
                  if (!brand) return null;
                  return (
                    <div className="flex items-center gap-2">
                      {brand.logo ? (
                        <div className="relative h-4 w-4 rounded-sm overflow-hidden bg-muted">
                          <Image
                            src={brand.logo}
                            alt={brand.name}
                            fill
                            className="object-contain"
                            sizes="16px"
                          />
                        </div>
                      ) : (
                        <div className="h-4 w-4 rounded-sm bg-muted" />
                      )}
                      <span>{brand.name}</span>
                    </div>
                  );
                })()}
              </SelectValue>
            </SelectTrigger>
            <SelectContent position="popper">
              {brandsList.map((b) => (
                <SelectItem key={b.slug} value={b.slug}>
                  <div className="flex items-center gap-2">
                    {b.logo ? (
                      <div className="relative h-5 w-5 rounded-sm overflow-hidden bg-muted">
                        <Image
                          src={b.logo}
                          alt={b.name}
                          fill
                          className="object-contain"
                          sizes="20px"
                        />
                      </div>
                    ) : (
                      <div className="h-5 w-5 rounded-sm bg-muted" />
                    )}
                    <span>{b.name}</span>
                  </div>
                </SelectItem>
              ))}
              <SelectSeparator />
              <SelectItem value="__create_new__" className="text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  <span>Add New Brand</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          {errors?.brandSlug && (
            <p className="text-xs text-destructive">
              {errors.brandSlug[0]}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            The manufacturer or brand of this product
          </p>
          <QuickCreateBrandDialog
            open={brandDialogOpen}
            onOpenChange={setBrandDialogOpen}
            onSuccess={(newBrand) => {
              setBrandsList([...brandsList, newBrand]);
              onBrandSlugChange(newBrand.slug);
            }}
          />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <Switch
            id="featured"
            checked={featured}
            onCheckedChange={onFeaturedChange}
          />
          <Label htmlFor="featured">Featured product</Label>
        </div>
        <p className="text-xs text-muted-foreground">
          Shown in &quot;Featured Products&quot; on the home page, in the same order as the Products list.
          Pick 3, 6 or 9 so the 3-column grid has full rows.
        </p>
      </div>
    </div>
  );
}
