import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { CookieOptions } from "@supabase/ssr";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    // cookie から戻り先を取得（pushReturnUrl で設定される）
    const returnCookie = request.cookies.get("yubikiri_return")?.value;
    const returnUrl = returnCookie ? decodeURIComponent(returnCookie) : "/";

    const separator = returnUrl.includes("?") ? "&" : "?";
    const response = NextResponse.redirect(`${origin}${returnUrl}${separator}logged_in=true`);

    // 戻り先 cookie を削除
    response.cookies.set("yubikiri_return", "", { path: "/", maxAge: 0 });

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
