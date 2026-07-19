import { NextResponse, type NextRequest } from "next/server";

import { resolveSafeNextPath } from "@/features/auth/utils/safe-next-path";
import { createSupabaseSessionClient } from "@/lib/supabase/session";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const nextPath = resolveSafeNextPath(searchParams.get("next"));

  if (code === null || code.trim() === "") {
    return NextResponse.redirect(
      new URL("/login?error=auth_callback_failed", origin),
    );
  }

  const supabase = await createSupabaseSessionClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error !== null) {
    return NextResponse.redirect(
      new URL("/login?error=auth_callback_failed", origin),
    );
  }

  return NextResponse.redirect(new URL(nextPath, origin));
}
