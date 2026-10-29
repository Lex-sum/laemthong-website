"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Plus } from "lucide-react";
import { SlugInput } from "./slug-input";
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
import Image from "next/image";
import type { DbBrand, DbCategory } from "@/data/types";

interface ProductBasicInfoTabProps {
  product?: {
    name: { th: string; en: string };
    short_description: { th: string; en: string };
    slug: string;
  };
  /** Pre-fills both TH and EN short description for new products (still editable). */
  defaultShortDescription?: string;
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

      <SlugInput
        isCustomSlug={isCustomSlug}
        onToggleCustom={onToggleCustomSlug}
        slug={slug}
        onSlugChange={onSlugChange}
        isEditing={isEditing}
        tooltipText='The URL-friendly version of the name. Used in web addresses (e.g., "hydraulic-pump" → /products/hydraulic-pump). Auto-generated from the English name unless customized.'
        editWarning="Changing the slug will migrate product images to the new URL path"
        error={errors?.slug?.[0]}
      />

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
          Featured products appear in the homepage hero section
        </p>
      </div>
    </div>
  );
}
