import { revalidatePath } from "next/cache";
import { getAdminUser } from "@/lib/auth";
import { mustChangePassword } from "@/lib/admin-roles";
import { logActivity } from "@/lib/activity";
import { parseProductCSV } from "@/lib/bulk-upload/csv-parser";
import { validateProductRows } from "@/lib/bulk-upload/validator";
import { importProducts } from "@/lib/bulk-upload/importer";
import type { ImportOptions } from "@/lib/bulk-upload/types";

const streamHeaders = {
  "Content-Type": "text/plain; charset=utf-8",
  "Cache-Control": "no-cache",
  "Transfer-Encoding": "chunked",
};

/** Product DATA import from CSV (streams progress). Images are imported separately. */
export async function POST(request: Request) {
  // Auth check — proxy does not cover /api routes
  const user = await getAdminUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (mustChangePassword(user)) {
    return Response.json({ error: "Set a new password first" }, { status: 403 });
  }

  const formData = await request.formData();
  const csvFile = formData.get("csv") as File | null;
  const optionsJson = formData.get("options") as string | null;

  if (!csvFile) {
    return Response.json({ error: "A CSV file is required" }, { status: 400 });
  }

  let options: ImportOptions;
  try {
    options = optionsJson
      ? JSON.parse(optionsJson)
      : { overwriteExisting: false, skipErrors: true };
  } catch {
    return Response.json({ error: "Invalid options" }, { status: 400 });
  }

  let csvText: string;
  try {
    csvText = await csvFile.text();
  } catch {
    return Response.json({ error: "Failed to read CSV file" }, { status: 400 });
  }

  const parsedRows = parseProductCSV(csvText);
  if (parsedRows.length === 0) {
    return Response.json({ error: "CSV is empty or invalid" }, { status: 400 });
  }

  const validated = await validateProductRows(parsedRows);
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of importProducts(validated, options)) {
          controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
        }

        // Revalidate after all imports complete
        revalidatePath("/admin/products");
        revalidatePath("/", "layout");
        await logActivity(user, {
          action: "bulk_import",
          entity: "product",
          summary: `Imported ${validated.length} rows from CSV`,
        });

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
