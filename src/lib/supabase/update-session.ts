import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Refresh the Auth session cookie on each matched request.
 * Does not redirect unauthenticated users — timeline/thread remain public.
 */
export async function updateSession(
  request: NextRequest,
): Promise<NextResponse> {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (
    supabaseUrl === undefined ||
    supabaseUrl.trim() === "" ||
    anonKey === undefined ||
    anonKey.trim() === ""
  ) {
    return supabaseResponse;
  }

  const supabase = createServerClient(supabaseUrl, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
        Object.entries(headers).forEach(([key, value]) => {
          supabaseResponse.headers.set(key, value);
        });
      },
    },
  });

  // Required so expired tokens refresh before Server Components read the session.
  await supabase.auth.getUser();

  return supabaseResponse;
}
