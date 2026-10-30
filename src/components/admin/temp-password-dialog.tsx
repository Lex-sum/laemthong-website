"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Check, Copy } from "lucide-react";

/** Shows a temporary password once. Closing it is the only way out — it can't be viewed again. */
export function TempPasswordDialog({
  email,
  password,
  onClose,
}: {
  email: string;
  password: string | null;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    if (!password) return;
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <Dialog
      open={!!password}
      onOpenChange={(open) => {
        if (!open) {
          setCopied(false);
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Temporary password</DialogTitle>
          <DialogDescription>
            Give this to <span className="font-medium text-foreground">{email}</span>. They
            must choose a new password the first time they sign in.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2">
          <code className="flex-1 select-all rounded-md border bg-muted px-3 py-2 font-mono text-base tracking-wider">
            {password}
          </code>
          <Button variant="outline" size="icon" onClick={copy} aria-label="Copy password">
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>

        <Alert>
          <AlertDescription className="text-xs">
            This password is shown only once and is not stored anywhere. Send it privately
            (not in a group chat). If it&apos;s lost, use Reset password again.
          </AlertDescription>
        </Alert>

        <DialogFooter>
          <Button onClick={onClose}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
