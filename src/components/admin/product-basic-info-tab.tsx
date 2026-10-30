"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Plus } from "lucide-react";
import { SlugInput } from "./slug-input";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BilingualInput } from "./bilingual-input";
import { BilingualTextarea } from "./bilingual-textarea";
import { ManageCategoriesDialog } from "./manage-categories-dialog";
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
  categories: initialCategories,
  brands: initialBrands,
  errors,
}: ProductBasicInfoTabProps) {
  const [categoriesList, setCategoriesList] = useState(initialCategories);
  const [brandsList, setBrandsList] = useState(initialBrands);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [brandDialogOpen, setBrandDialogOpen] = useState(false);

  return (
    <div className="space-y-6">
      <BilingualInput
        label="Product Name"
        nameTh="nameTh"
        nameEn="nameEn"
        defaultValueTh={product?.name.th}
        defaultValueEn={product?.name.en}
        required
        errorTh={errors?.nameTh?.[0]}
        errorEn={errors?.nameEn?.[0]}
        onChangeEn={handleNameChange}
        helperText="The display name of the product in both languages"
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
          tooltipText='The URL-friendly version of the name, used in the page address (/products/your-slug). Use the SAP item code for products sold from SAP. It cannot be changed after the product is created.'
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
        rows={2}
        errorTh={errors?.shortDescriptionTh?.[0]}
        errorEn={errors?.shortDescriptionEn?.[0]}
        helperText="Brief summary shown in product cards (1-2 sentences)"
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Category *</Label>
          <Select
            value={categorySlug}
            onValueChange={(val) => {
              if (val === "__create_new__") {
                setCategoryDialogOpen(true);
              } else {
                onCategorySlugChange(val);
              }
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select category">
                {categorySlug && (() => {
                  const cat = categoriesList.find(c => c.slug === categorySlug);
                  if (!cat) return null;
                  return cat.name.en;
                })()}
              </SelectValue>
            </SelectTrigger>
            <SelectContent position="popper">
              {categoriesList.map((cat) => (
                <SelectItem key={cat.slug} value={cat.slug}>
                  {cat.name.en}
                </SelectItem>
              ))}
              <SelectSeparator />
              <SelectItem value="__create_new__" className="text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  <span>Manage Categories</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          {errors?.categorySlug && (
            <p className="text-xs text-destructive">
              {errors.categorySlug[0]}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            The product category for organization and filtering
          </p>
          <ManageCategoriesDialog
            open={categoryDialogOpen}
            onOpenChange={setCategoryDialogOpen}
            categories={categoriesList}
            selectedSlug={categorySlug}
            onCreated={(newCat) => {
              setCategoriesList([...categoriesList, newCat]);
              onCategorySlugChange(newCat.slug);
            }}
            onDeleted={(deletedSlug) => {
              setCategoriesList(categoriesList.filter((c) => c.slug !== deletedSlug));
              if (categorySlug === deletedSlug) onCategorySlugChange("");
            }}
          />
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
