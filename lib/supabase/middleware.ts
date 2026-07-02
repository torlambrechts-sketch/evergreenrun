import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

import type { Database } from "@/lib/types/database.types";

/** Routes a signed-out user is allowed to reach. Everything else requires auth. */
const PUBLIC_PATHS = ["/", "/login", "/signup", "/auth", "/calculator"];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

/**
 * Refreshes the Supabase auth session on every request and guards private routes.
 * Must run in middleware so the refreshed session cookie is written to the response.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  // Fail safe on misconfiguration: never 500 the whole site (incl. public pages)
  // because Supabase env is missing. Let public paths render; send private paths
  // to login so the failure is visible without taking everything down.
  if (!url || !key) {
    console.error("[auth] Supabase env vars are not set");
    if (isPublicPath(request.nextUrl.pathname)) return supabaseResponse;
    const to = request.nextUrl.clone();
    to.pathname = "/login";
    return NextResponse.redirect(to);
  }

  const supabase = createServerClient<Database>(
    url,
    key,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // IMPORTANT: do not run code between createServerClient and getUser().
  let user = null;
  try {
    ({
      data: { user },
    } = await supabase.auth.getUser());
  } catch (err) {
    // Auth service hiccup — don't take public pages down over it.
    console.error("[auth] getUser failed", err);
    if (isPublicPath(request.nextUrl.pathname)) return supabaseResponse;
  }

  if (!user && !isPublicPath(request.nextUrl.pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
