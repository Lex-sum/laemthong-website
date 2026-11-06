import { type NextRequest, NextResponse } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { createServerClient } from "@supabase/ssr";
import { routing } from "./i18n/routing";
import { mustChangePassword } from "./lib/admin-roles";

const intlMiddleware = createIntlMiddleware(routing);

// Categories of the old flat structure → where their products are now.
// Redirected here so search engines get a real permanent redirect (the products page
// streams, so a redirect from the page itself can only be a client-side refresh).
const LEGACY_CATEGORIES: Record<string, string> = {
  "flowmeter-regulator": "welding-regulators",
  "safety-equipment": "flashback-arrestors",
  machine: "welding-machines",
  "equipment-consumable": "filler-metals",
};

async function getSupabaseUser(request: NextRequest, response: NextResponse) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Admin routes — protect with Supabase Auth
  if (pathname.startsWith("/admin")) {
    const isLoginPage = pathname === "/admin/login";
    const isSetupPage = pathname === "/admin/setup-password";
    const response = NextResponse.next();
    const user = await getSupabaseUser(request, response);

    if (!user && !isLoginPage && !isSetupPage) {
      const loginUrl = new URL("/admin/login", request.url);
      return NextResponse.redirect(loginUrl);
    }

    // Temporary password from an owner — must set a new one before anything else.
    // Only page loads (GET) are redirected; server actions are guarded by requireAdmin().
    if (user && mustChangePassword(user) && !isSetupPage && request.method === "GET") {
      const setupUrl = new URL("/admin/setup-password", request.url);
      return NextResponse.redirect(setupUrl);
    }

    if (user && isLoginPage) {
      const adminUrl = new URL("/admin", request.url);
      return NextResponse.redirect(adminUrl);
    }

    return response;
  }

  const legacyCategory = request.nextUrl.searchParams.get("category");
  if (legacyCategory && LEGACY_CATEGORIES[legacyCategory] && /^\/(th|en)\/products\/?$/.test(pathname)) {
    const url = request.nextUrl.clone();
    url.searchParams.set("category", LEGACY_CATEGORIES[legacyCategory]);
    return NextResponse.redirect(url, 308);
  }

  // All other routes — next-intl handles locale routing
  return intlMiddleware(request);
}

export const config = {
  matcher: "/((?!api|trpc|_next|_vercel|.*\\..*).*)",
};
