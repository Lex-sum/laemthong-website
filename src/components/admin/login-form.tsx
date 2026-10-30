"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { loginAction, type AuthFormState } from "@/app/admin/actions/auth";
import { Loader2 } from "lucide-react";

export function LoginForm() {
  const [state, formAction, isPending] = useActionState<AuthFormState, FormData>(
    loginAction,
    {}
  );

  return (
    <form action={formAction} className="space-y-4">
      {state.message && (
        <Alert variant="destructive">
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="admin@example.com"
          autoComplete="email"
          required
        />
        {state.errors?.email && (
          <p className="text-xs text-destructive">{state.errors.email[0]}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="Enter your password"
          autoComplete="current-password"
          required
        />
        {state.errors?.password && (
          <p className="text-xs text-destructive">{state.errors.password[0]}</p>
        )}
      </div>

      <Button type="submit" variant="accent" className="w-full" disabled={isPending}>
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Signing in...
          </>
        ) : (
          "Sign in"
        )}
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        Forgot your password? Ask an owner to reset it from the Users page.
      </p>
    </form>
  );
}
