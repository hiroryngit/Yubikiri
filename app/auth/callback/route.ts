import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { CookieOptions } from "@supabase/ssr";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  // 戻り先: クエリパラメータ → cookie → デフォルト "/"
  const next =
    searchParams.get("next") ??
    decodeURIComponent(request.cookies.get("auth_redirect")?.value ?? "") ??
    "/";

  const redirectUrl = `${origin}${next || "/"}`;

  if (code) {
    const response = NextResponse.redirect(redirectUrl);

    // auth_redirect cookie を削除
    response.cookies.set("auth_redirect", "", { path: "/", maxAge: 0 });

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(
            cookiesToSet: {
              name: string;
              value: string;
              options: CookieOptions;
            }[],
          ) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options);
            });
          },
        },
      },
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return response;
    }
  }

  return NextResponse.redirect(
    `${origin}/auth/error?error=OAuth+callback+failed`,
  );
}
