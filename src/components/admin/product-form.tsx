"use client";

import { useActionState, useEffect, useId, useState, useMemo } from "react";
import { Label } from "@/components/ui/label";
import { FormErrorAlert } from "./form-error-alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2, AlertCircle, Circle } from "lucide-react";
import { ImageUpload } from "./image-upload";
import { BilingualTextarea } from "./bilingual-textarea";
import { ProductSpecificationsSection } from "./product-specifications-section";
import { ProductFeaturesSection } from "./product-features-section";
import { ProductDocumentsSection } from "./product-documents-section";
import { ProductBasicInfoTab } from "./product-basic-info-tab";
import {
  createProductAction,
  updateProductAction,
} from "@/app/admin/actions/products";
import type { ActionState } from "@/app/admin/actions/types";
import { FormSubmitButton } from "./form-submit-button";
import { toast } from "sonner";
import { useFormSlug } from "@/hooks/use-form-slug";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";
import { useUnsavedChangesContext } from "./unsaved-changes-provider";
import type { DbProduct, DbBrand, DbCategory, LocalizedString } from "@/data/types";

/** Editable starting values for a new product (e.g. from a SAP B1 item). */
export interface ProductFormDefaults {
  slug?: string;
  shortDescription?: string;
}

interface ProductFormProps {
  product?: DbProduct;
  brands: DbBrand[];
  categories: DbCategory[];
  defaults?: ProductFormDefaults;
}

export function ProductForm({ product, brands, categories, defaults }: ProductFormProps) {
  const isEditing = !!product;
  const action = isEditing ? updateProductAction : createProductAction;

  const [state, formAction, isPending] = useActionState<
    ActionState,
    FormData
  >(action, {});

  // Complex state for JSON fields
  const [images, setImages] = useState<string[]>(product?.images ?? []);

  // Temporary slug for image uploads during creation (before final slug is known)
  const tempId = useId();
  const tempSlug = `temp-${tempId.replace(/:/g, "")}`;

  const { slug: currentSlug, setSlug: setCurrentSlug, isCustomSlug, setIsCustomSlug, handleNameChange } = useFormSlug({
    initialSlug: product?.slug ?? defaults?.slug ?? "",
    initialName: product?.name.en ?? "",
    isEditing,
    initialCustom: !product && !!defaults?.slug,
  });

  const [specifications, setSpecifications] = useState<
    { label: LocalizedString; value: LocalizedString }[]
  >(product?.specifications ?? []);
  const [features, setFeatures] = useState<LocalizedString[]>(
    product?.features ?? []
  );
  const [documents, setDocuments] = useState<{ name: string; url: string }[]>(
    product?.documents ?? []
  );
  const [featured, setFeatured] = useState(product?.featured ?? false);

  const [descriptionTh, setDescriptionTh] = useState(product?.description.th ?? "");
  const [descriptionEn, setDescriptionEn] = useState(product?.description.en ?? "");

  const [categorySlug, setCategorySlug] = useState(product?.category_slug ?? "");
  const [brandSlug, setBrandSlug] = useState(product?.brand_slug ?? "");

  const [imagesUploading, setImagesUploading] = useState(false);

  // Dirty state tracking for unsaved changes warning
  const [initialValues] = useState({
    slug: product?.slug ?? defaults?.slug ?? "",
    images: JSON.stringify(product?.images ?? []),
    specifications: JSON.stringify(product?.specifications ?? []),
    features: JSON.stringify(product?.features ?? []),
    documents: JSON.stringify(product?.documents ?? []),
    categorySlug: product?.category_slug ?? "",
    brandSlug: product?.brand_slug ?? "",
    featured: product?.featured ?? false,
    descriptionTh: product?.description.th ?? "",
    descriptionEn: product?.description.en ?? "",
  });

  const isDirty =
    currentSlug !== initialValues.slug ||
    JSON.stringify(images) !== initialValues.images ||
    JSON.stringify(specifications) !== initialValues.specifications ||
    JSON.stringify(features) !== initialValues.features ||
    JSON.stringify(documents) !== initialValues.documents ||
    categorySlug !== initialValues.categorySlug ||
    brandSlug !== initialValues.brandSlug ||
    featured !== initialValues.featured ||
    descriptionTh !== initialValues.descriptionTh ||
    descriptionEn !== initialValues.descriptionEn;

  useUnsavedChanges(isDirty);
  const { setIsDirty } = useUnsavedChangesContext();
  useEffect(() => { setIsDirty(isDirty); }, [isDirty, setIsDirty]);

  useEffect(() => {
    if (state.success) {
      toast.success(isEditing ? "Product updated" : "Product created");
    }
  }, [state.success, isEditing]);

  // Tab completion and error status
  type TabStatus = 'complete' | 'error' | 'incomplete';
  const tabStatus = useMemo<Record<string, TabStatus>>(() => {
    const errors = state.errors || {};

    const basicErrors = ['nameTh', 'nameEn', 'shortDescriptionTh', 'shortDescriptionEn', 'categorySlug', 'brandSlug'];
    const descriptionErrors = ['descriptionTh', 'descriptionEn'];

    const hasBasicError = basicErrors.some(field => errors[field]);
    const hasDescriptionError = descriptionErrors.some(field => errors[field]);

    const isBasicComplete = categorySlug && brandSlug;
    const isDescriptionComplete = descriptionTh.trim().length > 0 && descriptionEn.trim().length > 0;
    const isImagesAdded = images.length > 0;
    const isDetailsAdded = specifications.length > 0 || features.length > 0 || documents.length > 0;

    return {
      basic: hasBasicError ? 'error' : isBasicComplete ? 'complete' : 'incomplete',
      description: hasDescriptionError ? 'error' : isDescriptionComplete ? 'complete' : 'incomplete',
      images: isImagesAdded ? 'complete' : 'incomplete',
      details: isDetailsAdded ? 'complete' : 'incomplete',
    };
  }, [state.errors, categorySlug, brandSlug, descriptionTh, descriptionEn, images, specifications, features, documents]);

  const getTabIcon = (status: TabStatus) => {
    if (status === 'complete') {
      return <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />;
    }
    if (status === 'error') {
      return <AlertCircle className="h-3.5 w-3.5 text-destructive" />;
    }
    return <Circle className="h-3.5 w-3.5 text-muted-foreground" />;
  };

  return (
    <form action={formAction} className="space-y-6">
      {isEditing && (
        <input type="hidden" name="originalSlug" value={product.slug} />
      )}
      <input type="hidden" name="slug" value={currentSlug} />
      <input type="hidden" name="images" value={JSON.stringify(images)} />
      <input
        type="hidden"
        name="specifications"
        value={JSON.stringify(specifications)}
      />
      <input type="hidden" name="features" value={JSON.stringify(features)} />
      <input type="hidden" name="documents" value={JSON.stringify(documents)} />
      {featured && <input type="hidden" name="featured" value="on" />}
      <input type="hidden" name="categorySlug" value={categorySlug} />
      <input type="hidden" name="brandSlug" value={brandSlug} />

      <FormErrorAlert message={state.message} errors={state.errors} />

      <Tabs defaultValue="basic">
        <TabsList>
          <TabsTrigger value="basic" className="gap-2">
            {getTabIcon(tabStatus.basic)}
            Basic Info
          </TabsTrigger>
          <TabsTrigger value="description" className="gap-2">
            {getTabIcon(tabStatus.description)}
            Description
          </TabsTrigger>
          <TabsTrigger value="images" className="gap-2">
            {getTabIcon(tabStatus.images)}
            Images
          </TabsTrigger>
          <TabsTrigger value="details" className="gap-2">
            {getTabIcon(tabStatus.details)}
            Details
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Basic Info */}
        <TabsContent value="basic" forceMount className="data-[state=inactive]:hidden pt-4">
          <ProductBasicInfoTab
            product={product}
            defaultShortDescription={defaults?.shortDescription}
            isEditing={isEditing}
            slug={currentSlug}
            onSlugChange={setCurrentSlug}
            isCustomSlug={isCustomSlug}
            onToggleCustomSlug={setIsCustomSlug}
            handleNameChange={handleNameChange}
            categorySlug={categorySlug}
            onCategorySlugChange={setCategorySlug}
            brandSlug={brandSlug}
            onBrandSlugChange={setBrandSlug}
            featured={featured}
            onFeaturedChange={setFeatured}
            categories={categories}
            brands={brands}
            errors={state.errors}
          />
        </TabsContent>

        {/* Tab 2: Description */}
        <TabsContent value="description" forceMount className="data-[state=inactive]:hidden space-y-6 pt-4">
          <BilingualTextarea
            label="Full Description"
            nameTh="descriptionTh"
            nameEn="descriptionEn"
            defaultValueTh={product?.description.th}
            defaultValueEn={product?.description.en}
            required
            rows={10}
            errorTh={state.errors?.descriptionTh?.[0]}
            errorEn={state.errors?.descriptionEn?.[0]}
            helperText="Detailed product information for the product detail page"
            onChangeTh={setDescriptionTh}
            onChangeEn={setDescriptionEn}
          />
        </TabsContent>

        {/* Tab 3: Images */}
        <TabsContent value="images" forceMount className="data-[state=inactive]:hidden space-y-6 pt-4">
          <div className="space-y-3">
            <div>
              <Label>Product Images (Optional)</Label>
              <p className="text-xs text-muted-foreground mt-1">
                Upload product photos. First image is used as the thumbnail. Drag to reorder. Maximum 10 images.
              </p>
            </div>
            <ImageUpload
              label=""
              value={images}
              onChange={(urls) => setImages(urls as string[])}
              onUploadStateChange={setImagesUploading}
              folder="products"
              entitySlug={isEditing ? currentSlug : tempSlug}
              multiple
              maxFiles={10}
              aspectRatio={4 / 3}
              aspectRatioLabel="4:3 landscape"
              recommendedPx="800 × 600 px"
              reorderable
              showPrimaryBadge
            />
          </div>
        </TabsContent>

        {/* Tab 4: Details */}
        <TabsContent value="details" forceMount className="data-[state=inactive]:hidden space-y-8 pt-4">
          <ProductSpecificationsSection
            specifications={specifications}
            onSpecificationsChange={setSpecifications}
          />
          <ProductFeaturesSection
            features={features}
            onFeaturesChange={setFeatures}
          />
          <ProductDocumentsSection
            documents={documents}
            onDocumentsChange={setDocuments}
          />
        </TabsContent>
      </Tabs>

      <div className="flex gap-3 border-t pt-6">
        <FormSubmitButton
          isPending={isPending}
          isUploading={imagesUploading}
          isEditing={isEditing}
          entityName="Product"
        />
      </div>
    </form>
  );
}
