import type { Metadata } from "next";
import { requireOwner } from "@/lib/auth";
import { adminListUsers } from "@/lib/db/admin";
import { UsersTable } from "@/components/admin/users-table";

export const metadata: Metadata = {
  title: "Users",
};

export default async function UsersPage() {
  const me = await requireOwner();
  const users = await adminListUsers();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Users</h1>
        <p className="text-sm text-muted-foreground">
          Admin panel accounts ({users.length}). Owners manage users; admins manage catalog and
          content.
        </p>
      </div>

      <UsersTable users={users} currentUserId={me.id} />
    </div>
  );
}
