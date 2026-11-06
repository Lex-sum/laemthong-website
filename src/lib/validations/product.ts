import { z } from "zod";
import { slugSchema, sortOrderSchema } from "./shared";

/** Optional text field: missing / null from FormData or CSV becomes "". */
const optionalText = z.string().nullish().transform((v) => v?.trim() ?? "");

// Only the Thai name and short description are required. English is optional (the
// English site falls back to Thai and hides untranslated products from search), and the
// long description falls back to the short description.
export const productSchema = z.object({
  slug: slugSchema,
  nameTh: z.string().trim().min(1, "Thai name is required"),
  nameEn: optionalText,
  shortDescriptionTh: z.string().trim().min(1, "Thai short description is required"),
  shortDescriptionEn: optionalText,
  descriptionTh: optionalText,
  descriptionEn: optionalText,
  categorySlug: z.string().min(1, "Category is required"),
  brandSlug: z.string().min(1, "Brand is required"),
  images: z.string().optional(),
  /** JSON ProductSpecValues (attribute id → value) */
  specValues: z.string().optional(),
  features: z.string().optional(),
  documents: z.string().optional(),
  featured: z.string().optional(),
  sortOrder: sortOrderSchema,
});

