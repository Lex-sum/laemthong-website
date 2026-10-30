"use client";

import { useState } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { AdminRole } from "@/lib/admin-roles";
import { KeyRound, LogOut, User, ExternalLink } from "lucide-react";
import { logoutAction } from "@/app/admin/actions/auth";
import { ChangePasswordDialog } from "@/components/admin/change-password-dialog";
import { ThemeToggle } from "@/components/admin/theme-toggle";

export function AdminHeader({ email, role }: { email?: string; role?: AdminRole }) {
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);

  return (
    <header className="flex h-14 items-center gap-3 border-b bg-background px-4">
      <SidebarTrigger />
      <Separator orientation="vertical" className="h-5" />
      <div className="flex-1" />
      <a
        href="/"
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs text-muted-foreground hover:text-foreground"
      >
        View site <ExternalLink className="ml-1 inline h-3 w-3" />
      </a>
      <ThemeToggle />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-2">
            <User className="h-4 w-4" />
            <span className="hidden text-xs sm:inline">
              {email || "Admin"}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {role && (
            <>
              <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                Signed in as {role === "owner" ? "Owner" : "Admin"}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
            </>
          )}
          <DropdownMenuItem onSelect={() => setPasswordDialogOpen(true)}>
            <KeyRound className="mr-2 h-4 w-4" />
            Change Password
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <form action={logoutAction}>
              <button type="submit" className="flex w-full items-center gap-2">
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </form>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ChangePasswordDialog
        open={passwordDialogOpen}
        onOpenChange={setPasswordDialogOpen}
      />
    </header>
  );
}
