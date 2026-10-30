"use client";

import { useActionState, useEffect, useId, useState } from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { FormErrorAlert } from "./form-error-alert";
import { FormSubmitButton } from "./form-submit-button";
import { BilingualInput } from "./bilingual-input";
import { BilingualTextarea } from "./bilingual-textarea";
import { ImageUpload } from "./image-upload";
import { SlugInput } from "./slug-input";
import { ProductFeaturesSection } from "./product-features-section";
import { ServiceStepsSection } from "./service-steps-section";
import { createServiceAction, updateServiceAction } from "@/app/admin/actions/services";
import type { ActionState } from "@/app/admin/actions/types";
import { useFormSlug } from "@/hooks/use-form-slug";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";
import { useUnsavedChangesContext } from "./unsaved-changes-provider";
import type { DbService, LocalizedString, ServiceStep } from "@/data/types";

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-5 rounded-xl border bg-card p-6">
      <h2 className="font-semibold">{title}</h2>
      {children}
    </section>
  );
}

export function ServiceForm({ service }: { service?: DbService }) {
  const isEditing = !!service;
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    isEditing ? updateServiceAction : createServiceAction,
    {}
  );
  const e = state.errors;

  const tempId = useId();
  const tempSlug = `temp-${tempId.replace(/:/g, "")}`;

  const { slug, setSlug, isCustomSlug, setIsCustomSlug, handleNameChange } = useFormSlug({
    initialSlug: service?.slug ?? "",
    initialName: service?.title.en ?? "",
    isEditing,
  });

  const [imageUrl, setImageUrl] = useState(service?.image_url ?? "");
  const [isUploading, setIsUploading] = useState(false);
  const [isPrimary, setIsPrimary] = useState(service?.is_primary ?? false);
  const [features, setFeatures] = useState<LocalizedString[]>(service?.features ?? []);
  const [expertise, setExpertise] = useState<LocalizedString[]>(service?.expertise ?? []);
  const [steps, setSteps] = useState<ServiceStep[]>(service?.process_steps ?? []);

  const [initial] = useState(() =>
    JSON.stringify([service?.slug ?? "", service?.image_url ?? "", service?.is_primary ?? false, service?.features ?? [], service?.expertise ?? [], service?.process_steps ?? []])
  );
  const isDirty = JSON.stringify([slug, imageUrl, isPrimary, features, expertise, steps]) !== initial;
  useUnsavedChanges(isDirty);
  const { setIsDirty } = useUnsavedChangesContext();
  useEffect(() => { setIsDirty(isDirty); }, [isDirty, setIsDirty]);

  return (
    <form action={formAction} className="max-w-4xl space-y-6">
      {isEditing && <input type="hidden" name="originalSlug" value={service.slug} />}
      {!isEditing && <input type="hidden" name="tempSlug" value={tempSlug} />}
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="imageUrl" value={imageUrl} />
      <input type="hidden" name="isPrimary" value={String(isPrimary)} />
      <input type="hidden" name="features" value={JSON.stringify(features)} />
      <input type="hidden" name="expertise" value={JSON.stringify(expertise)} />
      <input type="hidden" name="processSteps" value={JSON.stringify(steps)} />

      <FormErrorAlert message={state.message} errors={e} />

      <Card title="Basics">
        <BilingualInput
          label="Service name"
          nameTh="titleTh"
          nameEn="titleEn"
          defaultValueTh={service?.title.th}
          defaultValueEn={service?.title.en}
          required
          errorTh={e?.titleTh?.[0]}
          errorEn={e?.titleEn?.[0]}
          onChangeEn={handleNameChange}
        />
        <SlugInput
          isCustomSlug={isCustomSlug}
          onToggleCustom={setIsCustomSlug}
          slug={slug}
          onSlugChange={setSlug}
          isEditing={isEditing}
          tooltipText='Used in the address, e.g. "repair" → /services/repair. Auto-generated from the English name unless customized.'
          editWarning="Changing the slug changes the page address — old links will stop working"
          error={e?.slug?.[0]}
        />
        <BilingualTextarea
          label="Short description"
          nameTh="shortDescriptionTh"
          nameEn="shortDescriptionEn"
          defaultValueTh={service?.short_description.th}
          defaultValueEn={service?.short_description.en}
          required
          rows={2}
          errorTh={e?.shortDescriptionTh?.[0]}
          errorEn={e?.shortDescriptionEn?.[0]}
          helperText="Shown on service cards (home page and Services page)"
        />
        <BilingualTextarea
          label="Full description"
          nameTh="descriptionTh"
          nameEn="descriptionEn"
          defaultValueTh={service?.description.th}
          defaultValueEn={service?.description.en}
          required
          rows={5}
          errorTh={e?.descriptionTh?.[0]}
          errorEn={e?.descriptionEn?.[0]}
          helperText="Top of the service page. Line breaks are kept."
        />
        <div className="flex items-center gap-3">
          <Switch id="isPrimary" checked={isPrimary} onCheckedChange={setIsPrimary} />
          <Label htmlFor="isPrimary" className="cursor-pointer">
            Core service <span className="font-normal text-muted-foreground">(marks it as a main service)</span>
          </Label>
        </div>
      </Card>

      <Card title="Image">
        <ImageUpload
          label="Service image"
          value={imageUrl}
          onChange={(url) => setImageUrl(url as string)}
          onUploadStateChange={setIsUploading}
          folder="services"
          entitySlug={isEditing ? slug : tempSlug}
          aspectRatio={4 / 3}
          aspectRatioLabel="4:3"
          recommendedPx="1200 × 900 px"
        />
      </Card>

      <Card title="Page sections">
        <ProductFeaturesSection
          features={features}
          onFeaturesChange={setFeatures}
          label="Key features"
          description="Checklist on the service page; the first 4 also appear on the Services page card."
          itemName="Feature"
          dndId="service-features"
        />
        <ProductFeaturesSection
          features={expertise}
          onFeaturesChange={setExpertise}
          label="Areas of expertise"
          description="Shown in the side column of the service page."
          itemName="Expertise"
          dndId="service-expertise"
        />
        <ServiceStepsSection steps={steps} onStepsChange={setSteps} />
      </Card>

      <Card title="SEO (optional)">
        <BilingualInput
          label="Page title"
          nameTh="metaTitleTh"
          nameEn="metaTitleEn"
          defaultValueTh={service?.meta_title.th}
          defaultValueEn={service?.meta_title.en}
          helperText="Browser tab and Google title. Empty = service name."
        />
        <BilingualTextarea
          label="Meta description"
          nameTh="metaDescriptionTh"
          nameEn="metaDescriptionEn"
          defaultValueTh={service?.meta_description.th}
          defaultValueEn={service?.meta_description.en}
          rows={2}
          helperText="Google search snippet. Empty = short description."
        />
      </Card>

      <div className="flex justify-end">
        <FormSubmitButton isPending={isPending} isUploading={isUploading} isEditing={isEditing} entityName="Service" />
      </div>
    </form>
  );
}
