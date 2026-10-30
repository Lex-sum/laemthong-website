import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AdminSidebar } from "./admin-sidebar";
import { AdminHeader } from "./admin-header";
import { getRole } from "@/lib/admin-roles";

export async function AdminShell({ children }: { children: ReactNode }) {
  const cookieStore = await cookies();
  const supabase = createSupabaseServerClient(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const role = user ? getRole(user) : "admin";

  return (
    <SidebarProvider>
      <AdminSidebar isOwner={role === "owner"} />
      <SidebarInset>
        <AdminHeader email={user?.email} role={role} />
        <main className="flex-1 p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
