import type { User } from "@supabase/supabase-js";

/**
 * Admin roles live in Supabase `app_metadata` (only the service role can write it).
 * Users without a role are treated as "admin". Safe to import from the proxy.
 */
export type AdminRole = "owner" | "admin";

export const ADMIN_ROLES: AdminRole[] = ["owner", "admin"];

export function getRole(user: Pick<User, "app_metadata">): AdminRole {
  return user.app_metadata?.role === "owner" ? "owner" : "admin";
}

/** Set when an owner creates the account or resets the password. */
export function mustChangePassword(user: Pick<User, "app_metadata">): boolean {
  return user.app_metadata?.must_change_password === true;
}
