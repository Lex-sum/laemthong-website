import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase";

/** Returns the signed-in Supabase user, or null when there is no valid session. */
export async function getAdminUser() {
  const cookieStore = await cookies();
  const supabase = createSupabaseServerClient(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/**
 * Guard for admin server actions and route handlers.
 * The proxy only protects page navigation under /admin — server actions can be
 * POSTed to any route, so every admin action must call this before doing work.
 */
export async function requireAdmin() {
  const user = await getAdminUser();
  if (!user) redirect("/admin/login");
  return user;
}
