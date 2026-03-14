import { createAdminClient } from "@/lib/supabase/admin";
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { CookieOptions } from "@supabase/ssr";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error || !code) {
    return NextResponse.redirect(
      `${origin}/auth/error?error=${encodeURIComponent(error || "LINE login failed")}`,
    );
  }

  try {
    // 1. Exchange authorization code for tokens
    const tokenRes = await fetch("https://api.line.me/oauth2/v2.1/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: `${origin}/auth/callback/line`,
        client_id: process.env.NEXT_PUBLIC_LINE_CHANNEL_ID!,
        client_secret: process.env.LINE_CHANNEL_SECRET!,
      }),
    });

    if (!tokenRes.ok) {
      console.error("LINE token exchange failed:", await tokenRes.text());
      return NextResponse.redirect(
        `${origin}/auth/error?error=LINE+token+exchange+failed`,
      );
    }

    const tokenData = await tokenRes.json();
    const idToken = tokenData.id_token;

    if (!idToken) {
      return NextResponse.redirect(
        `${origin}/auth/error?error=LINE+did+not+return+id_token`,
      );
    }

    // 2. Verify ID token and get profile
    const verifyRes = await fetch("https://api.line.me/oauth2/v2.1/verify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        id_token: idToken,
        client_id: process.env.NEXT_PUBLIC_LINE_CHANNEL_ID!,
      }),
    });

    if (!verifyRes.ok) {
      console.error("LINE token verify failed:", await verifyRes.text());
      return NextResponse.redirect(
        `${origin}/auth/error?error=LINE+token+verification+failed`,
      );
    }

    const profile = await verifyRes.json();
    const email = profile.email;
    const name = profile.name;
    const picture = profile.picture;
    const lineUserId = profile.sub;

    if (!email) {
      return NextResponse.redirect(
        `${origin}/auth/error?error=LINE+account+has+no+email.+Please+allow+email+access.`,
      );
    }

    // 3. Create or find user via admin API
    const admin = createAdminClient();

    // Check if user exists by email
    const { data: existingUsers } = await admin.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find((u) => u.email === email);

    let userId: string;

    if (existingUser) {
      userId = existingUser.id;
      // Update user metadata with LINE info
      await admin.auth.admin.updateUserById(userId, {
        user_metadata: {
          ...existingUser.user_metadata,
          line_user_id: lineUserId,
          name: name || existingUser.user_metadata?.name,
          avatar_url: picture || existingUser.user_metadata?.avatar_url,
        },
      });
    } else {
      // Create new user
      const { data: newUser, error: createError } =
        await admin.auth.admin.createUser({
          email,
          email_confirm: true,
          user_metadata: {
            line_user_id: lineUserId,
            name,
            avatar_url: picture,
            provider: "line",
          },
        });

      if (createError || !newUser.user) {
        console.error("Failed to create user:", createError);
        return NextResponse.redirect(
          `${origin}/auth/error?error=Failed+to+create+account`,
        );
      }
      userId = newUser.user.id;
    }

    // 4. Generate a session link for the user
    const { data: linkData, error: linkError } =
      await admin.auth.admin.generateLink({
        type: "magiclink",
        email,
      });

    if (linkError || !linkData) {
      console.error("Failed to generate link:", linkError);
      return NextResponse.redirect(
        `${origin}/auth/error?error=Failed+to+create+session`,
      );
    }

    // Extract token hash from the generated link
    const linkUrl = new URL(linkData.properties.action_link);
    const tokenHash = linkUrl.searchParams.get("token") || linkData.properties.hashed_token;

    // 5. Exchange token for session using OTP verify
    const returnCookie = request.cookies.get("yubikiri_return")?.value;
    const returnUrl = returnCookie ? decodeURIComponent(returnCookie) : "/";
    const separator = returnUrl.includes("?") ? "&" : "?";

    const response = NextResponse.redirect(
      `${origin}${returnUrl}${separator}logged_in=true`,
    );

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

    const { error: verifyError } = await supabase.auth.verifyOtp({
      type: "magiclink",
      token_hash: tokenHash,
    });

    if (verifyError) {
      console.error("Failed to verify OTP:", verifyError);
      return NextResponse.redirect(
        `${origin}/auth/error?error=Failed+to+create+session`,
      );
    }

    return response;
  } catch (err) {
    console.error("LINE callback error:", err);
    return NextResponse.redirect(
      `${origin}/auth/error?error=LINE+callback+error`,
    );
  }
}
