import { revalidatePath } from "next/cache";
import { getAdminUser } from "@/lib/auth";
import { parseProductCSV } from "@/lib/bulk-upload/csv-parser";
import { extractImagesFromZip } from "@/lib/bulk-upload/zip-handler";
import { validateProductRows, validateImageOnlyRows } from "@/lib/bulk-upload/validator";
import { importProducts, importImagesOnly } from "@/lib/bulk-upload/importer";
import type { ImportOptions } from "@/lib/bulk-upload/types";

const streamHeaders = {
  "Content-Type": "text/plain; charset=utf-8",
  "Cache-Control": "no-cache",
  "Transfer-Encoding": "chunked",
};

export async function POST(request: Request) {
  // Auth check — proxy does not cover /api routes
  const user = await getAdminUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Parse FormData
  const formData = await request.formData();
  const csvFile = formData.get("csv") as File | null;
  const zipFile = formData.get("zip") as File | null;
  const optionsJson = formData.get("options") as string | null;

  if (!csvFile && !zipFile) {
    return Response.json(
      { error: "At least one file (CSV or ZIP) is required" },
      { status: 400 }
    );
  }

  let options: ImportOptions;
  try {
    options = optionsJson
      ? JSON.parse(optionsJson)
      : { overwriteExisting: false, skipErrors: true };
  } catch {
    return Response.json({ error: "Invalid options" }, { status: 400 });
  }

  const encoder = new TextEncoder();

  // ZIP-only path: import images for existing/new products
  if (!csvFile && zipFile) {
    const imageMap = await extractImagesFromZip(zipFile);

    if (Object.keys(imageMap).length === 0) {
      return Response.json(
        { error: "No product image folders found in ZIP" },
        { status: 400 }
      );
    }

    const imageOnlyRows = await validateImageOnlyRows(imageMap);

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of importImagesOnly(imageMap, imageOnlyRows)) {
            controller.enqueue(
              encoder.encode(JSON.stringify(event) + "\n")
            );
          }

          revalidatePath("/admin/products");
          revalidatePath("/", "layout");
          controller.close();
        } catch (error) {
          const msg =
            error instanceof Error ? error.message : "Import failed";
          controller.enqueue(
            encoder.encode(
              JSON.stringify({ type: "error", slug: "", error: msg }) + "\n"
            )
          );
          controller.close();
        }
      },
    });

    return new Response(stream, { headers: streamHeaders });
  }

  // CSV path (csv-only or csv-and-zip)
  let csvText: string;
  try {
    csvText = await csvFile!.text();
  } catch {
    return Response.json(
      { error: "Failed to read CSV file" },
      { status: 400 }
    );
  }

  const parsedRows = parseProductCSV(csvText);
  if (parsedRows.length === 0) {
    return Response.json(
      { error: "CSV is empty or invalid" },
      { status: 400 }
    );
  }

  // Extract images from ZIP and validate
  const imageMap = zipFile ? await extractImagesFromZip(zipFile) : {};
  const validated = await validateProductRows(parsedRows, imageMap);

  // Stream import events
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of importProducts(validated, options)) {
          controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
        }

        // Revalidate after all imports complete
        revalidatePath("/admin/products");
        revalidatePath("/", "layout");

        controller.close();
      } catch (error) {
        const msg = error instanceof Error ? error.message : "Import failed";
        controller.enqueue(
          encoder.encode(
            JSON.stringify({ type: "error", slug: "", error: msg }) + "\n"
          )
        );
        controller.close();
      }
    },
  });

  return new Response(stream, { headers: streamHeaders });
}
