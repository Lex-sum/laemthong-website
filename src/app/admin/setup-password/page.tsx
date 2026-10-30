import Image from "next/image";
import { SetupPasswordForm } from "@/components/admin/setup-password-form";
import { getPageImage } from "@/lib/db";

export const metadata = {
  title: "Set a New Password",
};

export default async function SetupPasswordPage() {
  const logoUrl = await getPageImage("site-logo");

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          {logoUrl ? (
            <Image
              src={logoUrl}
              alt="Laemthong Syndicate"
              width={48}
              height={48}
              className="mx-auto h-12 w-12 rounded-lg object-contain"
              sizes="48px"
            />
          ) : (
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-foreground">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="h-7 w-7 text-primary-foreground"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
          )}
          <h1 className="mt-4 text-2xl font-bold text-foreground">
            Set a New Password
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Choose your own password to continue to the admin panel.
          </p>
          <div className="mx-auto mt-3 h-0.5 w-8 bg-primary" />
        </div>
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <SetupPasswordForm />
        </div>
      </div>
    </div>
  );
}
