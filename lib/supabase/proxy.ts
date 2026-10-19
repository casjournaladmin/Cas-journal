import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import {
  getSupabaseEnvironment,
  hasSupabaseEnvironment,
} from "@/lib/supabase/config";

export async function updateSession(request: NextRequest) {
  if (!hasSupabaseEnvironment()) {
    return NextResponse.next({ request });
  }

  const allCookies = request.cookies.getAll();
  const hasDevCookie =
    process.env.NODE_ENV !== "production" &&
    allCookies.some((c) => c.name === "cas_dev_identity");
  if (hasDevCookie) {
    return NextResponse.next({ request });
  }

  const hasAuthCookie = allCookies.some((c) => c.name.startsWith("sb-"));
  if (!hasAuthCookie) {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });
  const { url, publishableKey } = getSupabaseEnvironment();
  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
        Object.entries(headers).forEach(([name, value]) => {
          response.headers.set(name, value);
        });
      },
    },
  });

  try {
    await supabase.auth.getUser();
  } catch {
    // Silently continue if Supabase auth network call fails or times out in middleware
  }

  return response;
}
