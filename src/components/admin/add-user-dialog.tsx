"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, UserPlus } from "lucide-react";
import { createUserAction } from "@/app/admin/actions/users";
import type { AdminRole } from "@/lib/admin-roles";

export function AddUserDialog({
  onCreated,
}: {
  onCreated: (email: string, tempPassword: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<AdminRole>("admin");
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  function reset() {
    setEmail("");
    setRole("admin");
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsPending(true);
    setError(null);
    const result = await createUserAction(email, role);
    setIsPending(false);

    if (result.tempPassword) {
      const created = email.trim().toLowerCase();
      setOpen(false);
      reset();
      onCreated(created, result.tempPassword);
    } else {
      setError(result.message ?? "Failed to create user.");
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          Add user
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Add user</DialogTitle>
            <DialogDescription>
              A temporary password is generated. The user sets their own password at first
              sign-in. No email is sent.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="new-user-email">Email</Label>
            <Input
              id="new-user-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@laemthong.co.th"
              autoComplete="off"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Role</Label>
            <Select value={role} onValueChange={(v) => setRole(v as AdminRole)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin — manages catalog and content</SelectItem>
                <SelectItem value="owner">Owner — also manages users</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create user
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
