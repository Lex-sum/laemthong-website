import type { User } from "@supabase/supabase-js";
import { createSupabaseAdminClient } from "@/lib/supabase";

export type ActivityAction =
  | "create"
  | "update"
  | "delete"
  | "bulk_delete"
  | "bulk_import"
  | "reorder"
  | "reset_password"
  | "change_role";

export type ActivityEntity =
  | "product"
  | "brand"
  | "category"
  | "service"
  | "page_image"
  | "content"
  | "company"
  | "inquiry"
  | "user";

/**
 * Record who changed what in the admin panel. Never throws — a logging
 * failure must not undo or block the change that already happened.
 */
export async function logActivity(
  user: Pick<User, "id" | "email">,
  entry: {
    action: ActivityAction;
    entity: ActivityEntity;
    entityId?: string | null;
    summary?: string;
  }
): Promise<void> {
  try {
    await createSupabaseAdminClient().from("activity_log").insert({
      user_id: user.id,
      user_email: user.email ?? null,
      action: entry.action,
      entity: entry.entity,
      entity_id: entry.entityId ?? null,
      summary: entry.summary ?? null,
    });
  } catch (error) {
    console.error("Failed to write activity log:", error);
  }
}
