"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { KeyRound, Loader2, MoreHorizontal, Shield, ShieldOff, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AddUserDialog } from "@/components/admin/add-user-dialog";
import { TempPasswordDialog } from "@/components/admin/temp-password-dialog";
import {
  deleteUserAction,
  resetUserPasswordAction,
  setUserRoleAction,
} from "@/app/admin/actions/users";
import type { AdminUserRow } from "@/lib/db/admin";

type PendingConfirm =
  | { kind: "reset"; user: AdminUserRow }
  | { kind: "delete"; user: AdminUserRow };

function formatDate(iso: string | null): string {
  if (!iso) return "Never";
  return new Date(iso).toLocaleString("en-GB", {
    timeZone: "Asia/Bangkok",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function UsersTable({
  users,
  currentUserId,
}: {
  users: AdminUserRow[];
  currentUserId: string;
}) {
  const [shownPassword, setShownPassword] = useState<{ email: string; password: string } | null>(
    null
  );
  const [confirm, setConfirm] = useState<PendingConfirm | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function changeRole(user: AdminUserRow) {
    const next = user.role === "owner" ? "admin" : "owner";
    const result = await setUserRoleAction(user.id, next);
    if (result.success) toast.success(`${user.email} is now ${next}`);
    else toast.error(result.message ?? "Failed to change role");
  }

  async function runConfirm() {
    if (!confirm) return;
    setIsPending(true);
    const { kind, user } = confirm;
    const result =
      kind === "reset" ? await resetUserPasswordAction(user.id) : await deleteUserAction(user.id);
    setIsPending(false);
    setConfirm(null);

    if (!result.success) {
      toast.error(result.message ?? "Something went wrong");
    } else if (kind === "reset" && result.tempPassword) {
      setShownPassword({ email: user.email, password: result.tempPassword });
    } else {
      toast.success(`Deleted ${user.email}`);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <AddUserDialog
          onCreated={(email, password) => setShownPassword({ email, password })}
        />
      </div>

      <div className="rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead className="w-24">Role</TableHead>
              <TableHead className="hidden w-48 md:table-cell">Status</TableHead>
              <TableHead className="hidden w-48 lg:table-cell">Last sign-in</TableHead>
              <TableHead className="w-16 text-right" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => {
              const isMe = user.id === currentUserId;
              return (
                <TableRow key={user.id}>
                  <TableCell className="max-w-[280px] truncate font-medium">
                    {user.email}
                    {isMe && <span className="ml-2 text-xs text-muted-foreground">(you)</span>}
                  </TableCell>
                  <TableCell>
                    {user.role === "owner" ? (
                      <Badge>Owner</Badge>
                    ) : (
                      <Badge variant="secondary">Admin</Badge>
                    )}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {user.mustChangePassword ? (
                      <Badge variant="outline" className="border-amber-500 text-amber-600">
                        Must change password
                      </Badge>
                    ) : user.lastSignInAt ? (
                      <span className="text-sm text-muted-foreground">Active</span>
                    ) : (
                      <span className="text-sm text-muted-foreground">Never signed in</span>
                    )}
                  </TableCell>
                  <TableCell className="hidden text-sm text-muted-foreground lg:table-cell">
                    {formatDate(user.lastSignInAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label={`Actions for ${user.email}`}>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => setConfirm({ kind: "reset", user })}>
                          <KeyRound className="mr-2 h-4 w-4" />
                          Reset password
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          disabled={isMe}
                          onSelect={() => changeRole(user)}
                        >
                          {user.role === "owner" ? (
                            <>
                              <ShieldOff className="mr-2 h-4 w-4" />
                              Make admin
                            </>
                          ) : (
                            <>
                              <Shield className="mr-2 h-4 w-4" />
                              Make owner
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          disabled={isMe}
                          className="text-destructive focus:text-destructive"
                          onSelect={() => setConfirm({ kind: "delete", user })}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Confirm reset / delete */}
      <Dialog open={!!confirm} onOpenChange={(open) => !open && setConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirm?.kind === "reset" ? "Reset password?" : "Delete user?"}
            </DialogTitle>
            <DialogDescription>
              {confirm?.kind === "reset"
                ? `${confirm.user.email}'s current password stops working immediately. You'll get a temporary password to give them.`
                : `${confirm?.user.email} will lose access to the admin panel. This can't be undone.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirm(null)}>
              Cancel
            </Button>
            <Button
              variant={confirm?.kind === "delete" ? "destructive" : "default"}
              onClick={runConfirm}
              disabled={isPending}
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {confirm?.kind === "reset" ? "Reset password" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <TempPasswordDialog
        email={shownPassword?.email ?? ""}
        password={shownPassword?.password ?? null}
        onClose={() => setShownPassword(null)}
      />
    </div>
  );
}
