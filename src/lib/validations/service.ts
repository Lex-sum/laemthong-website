import { z } from "zod";
import { slugSchema, sortOrderSchema } from "./shared";

const localized = z.object({ th: z.string(), en: z.string() });

/** JSON-encoded list from a hidden form input; blank rows are dropped. */
const jsonList = <T extends z.ZodTypeAny>(item: T, isBlank: (v: z.infer<T>) => boolean) =>
  z
    .string()
    .default("[]")
    .transform((raw, ctx) => {
      try {
        return JSON.parse(raw) as unknown;
      } catch {
        ctx.addIssue({ code: "custom", message: "Invalid list" });
        return z.NEVER;
      }
    })
    .pipe(z.array(item).max(50))
    .transform((list) => list.filter((v) => !isBlank(v)));

const blankLocalized = (v: { th: string; en: string }) => !v.th.trim() && !v.en.trim();

export const serviceSchema = z.object({
  slug: slugSchema,
  titleTh: z.string().trim().min(1, "Thai title is required"),
  titleEn: z.string().trim().min(1, "English title is required"),
  shortDescriptionTh: z.string().trim().min(1, "Thai short description is required"),
  shortDescriptionEn: z.string().trim().min(1, "English short description is required"),
  descriptionTh: z.string().trim().min(1, "Thai description is required"),
  descriptionEn: z.string().trim().min(1, "English description is required"),
  metaTitleTh: z.string().trim().default(""),
  metaTitleEn: z.string().trim().default(""),
  metaDescriptionTh: z.string().trim().default(""),
  metaDescriptionEn: z.string().trim().default(""),
  features: jsonList(localized, blankLocalized),
  expertise: jsonList(localized, blankLocalized),
  processSteps: jsonList(
    z.object({ title: localized, description: localized }),
    (s) => blankLocalized(s.title) && blankLocalized(s.description)
  ),
  isPrimary: z
    .string()
    .optional()
    .transform((v) => v === "true"),
  imageUrl: z.string().trim().default(""),
  sortOrder: sortOrderSchema,
});

export type ServiceInput = z.infer<typeof serviceSchema>;
