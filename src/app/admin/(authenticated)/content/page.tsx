import type { Metadata } from "next";
import { adminGetAllPageImages, adminGetSiteContent } from "@/lib/db/admin";
import { PageImagesForm } from "@/components/admin/page-images-form";
import { ContentEditor, type EditorGroup } from "@/components/admin/content-editor";
import { TABS } from "@/data/page-image-slots";
import { CONTENT_SECTIONS } from "@/data/content-fields";
import { getDefaultContent } from "@/lib/site-content-defaults";

export const metadata: Metadata = {
  title: "Page Content",
};

type Props = {
  searchParams: Promise<{ section?: string }>;
};

export default async function PageContentPage({ searchParams }: Props) {
  const { section } = await searchParams;
  const tab = TABS.find((t) => t.value === section) ?? TABS[0];
  const groups = CONTENT_SECTIONS[tab.value] ?? [];

  const keys = groups.flatMap((g) => g.fields.map((f) => f.key));
  const [imageRows, overrides] = await Promise.all([adminGetAllPageImages(), adminGetSiteContent(keys)]);

  const images = new Map(imageRows.map((row) => [row.key, row.image_url]));

  const editorGroups: EditorGroup[] = groups.map((group) => ({
    title: group.title,
    description: group.description,
    fields: group.fields.map((field) => {
      const defaults = getDefaultContent(field.key);
      const override = overrides[field.key] ?? {};
      return {
        ...field,
        defaults,
        saved: { th: override.th || defaults.th, en: override.en || defaults.en },
      };
    }),
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Page Content · {tab.title}</h1>
        <p className="text-sm text-muted-foreground">
          Edit the text and images on this page. Text changes go live when you press Save; images
          save as soon as they upload.
        </p>
      </div>

      {editorGroups.length > 0 && (
        <div className="max-w-5xl space-y-3">
          <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Text</h2>
          <ContentEditor key={tab.value} section={tab.value} groups={editorGroups} />
        </div>
      )}

      {tab.slots.length > 0 && (
        <div className="max-w-5xl space-y-3">
          <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Images</h2>
          <PageImagesForm key={tab.value} images={images} activeSection={tab.value} />
        </div>
      )}
    </div>
  );
}
