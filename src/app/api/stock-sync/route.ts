import { timingSafeEqual } from "node:crypto";
import { createSupabaseAdminClient } from "@/lib/supabase";
import { stockSyncSchema } from "@/lib/validations/stock-sync";

/**
 * One-way stock feed from SAP Business One (scripts run on the SAP side push here).
 * The website never connects back to SAP. The token only grants writes to sap_stock.
 * Not covered by the proxy (matcher excludes /api), so auth is checked here.
 */

function isAuthorized(request: Request): boolean {
  const expected = process.env.STOCK_SYNC_TOKEN;
  if (!expected) return false;

  const header = request.headers.get("authorization") ?? "";
  if (!header.startsWith("Bearer ")) return false;

  const given = Buffer.from(header.slice("Bearer ".length));
  const wanted = Buffer.from(expected);
  return given.length === wanted.length && timingSafeEqual(given, wanted);
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = stockSyncSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid payload", issues: parsed.error.issues.slice(0, 5) },
      { status: 400 }
    );
  }

  const supabase = createSupabaseAdminClient();
  const data = parsed.data;

  // End of run: delete rows not seen in this run, but only if the run arrived complete
  if ("complete" in data) {
    const { count, error: countError } = await supabase
      .from("sap_stock")
      .select("item_code", { count: "exact", head: true })
      .eq("sync_id", data.syncId);

    if (countError) {
      return Response.json({ error: "Database error" }, { status: 500 });
    }
    if (count !== data.total) {
      return Response.json(
        { error: "Run incomplete, nothing deleted", received: count ?? 0, expected: data.total },
        { status: 409 }
      );
    }

    const { count: deleted, error } = await supabase
      .from("sap_stock")
      .delete({ count: "exact" })
      .neq("sync_id", data.syncId);

    if (error) {
      return Response.json({ error: "Database error" }, { status: 500 });
    }
    return Response.json({ deleted: deleted ?? 0 });
  }

  // Batch: de-duplicate by item code (last one wins) so the upsert can't conflict with itself
  const syncedAt = new Date().toISOString();
  const rows = [
    ...new Map(
      data.items.map((item) => [
        item.itemCode,
        {
          item_code: item.itemCode,
          item_name: item.itemName,
          on_hand: item.onHand,
          available: item.available,
          sync_id: data.syncId,
          synced_at: syncedAt,
        },
      ])
    ).values(),
  ];

  const { error } = await supabase
    .from("sap_stock")
    .upsert(rows, { onConflict: "item_code" });

  if (error) {
    return Response.json({ error: "Database error" }, { status: 500 });
  }
  return Response.json({ upserted: rows.length });
}
