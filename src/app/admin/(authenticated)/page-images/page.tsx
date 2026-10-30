import { redirect } from "next/navigation";

type Props = {
  searchParams: Promise<{ section?: string }>;
};

/** Page images now live together with page text at /admin/content. */
export default async function AdminPageImagesPage({ searchParams }: Props) {
  const { section } = await searchParams;
  redirect(section ? `/admin/content?section=${encodeURIComponent(section)}` : "/admin/content");
}
