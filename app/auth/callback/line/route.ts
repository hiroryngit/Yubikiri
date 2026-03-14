import { createAdminClient } from "@/lib/supabase/admin";
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { CookieOptions } from "@supabase/ssr";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const errorParam = searchParams.get("error");

  if (errorParam || !code) {
    return NextResponse.redirect(
      `${origin}/auth/error?error=${encodeURIComponent(errorParam || "LINE login failed")}`,
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
      const errText = await tokenRes.text();
      console.error("LINE token exchange failed:", errText);
      return NextResponse.redirect(
        `${origin}/auth/error?error=${encodeURIComponent("LINE token exchange failed: " + errText)}`,
      );
    }

    const tokenData = await tokenRes.json();
    const idToken = tokenData.id_token;
    const accessToken = tokenData.access_token;

    // 2. Get user profile - use access token for profile API (more reliable than id_token verify for email)
    let email: string | undefined;
    let name: string | undefined;
    let picture: string | undefined;
    let lineUserId: string | undefined;

    if (idToken) {
      // Verify ID token to get email (if available)
      const verifyRes = await fetch("https://api.line.me/oauth2/v2.1/verify", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          id_token: idToken,
          client_id: process.env.NEXT_PUBLIC_LINE_CHANNEL_ID!,
        }),
      });

      if (verifyRes.ok) {
        const idTokenData = await verifyRes.json();
        email = idTokenData.email;
        name = idTokenData.name;
        picture = idTokenData.picture;
        lineUserId = idTokenData.sub;
      }
    }

    // Fallback: get profile from access token
    if (!lineUserId && accessToken) {
      const profileRes = await fetch("https://api.line.me/v2/profile", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (profileRes.ok) {
        const profileData = await profileRes.json();
        lineUserId = profileData.userId;
        name = name || profileData.displayName;
        picture = picture || profileData.pictureUrl;
      }
    }

    if (!lineUserId) {
      return NextResponse.redirect(
        `${origin}/auth/error?error=Failed+to+get+LINE+profile`,
      );
    }

    // 3. Create or find user via admin API
    const admin = createAdminClient();

    // First try to find by LINE user ID in user_metadata
    const { data: allUsers } = await admin.auth.admin.listUsers();
    let existingUser = allUsers?.users?.find(
      (u) =>
        u.user_metadata?.line_user_id === lineUserId ||
        (email && u.email === email),
    );

    let userId: string;
    let userEmail: string;

    if (existingUser) {
      userId = existingUser.id;
      userEmail = existingUser.email!;
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
      // Need email to create user
      if (!email) {
        return NextResponse.redirect(
          `${origin}/auth/error?error=${encodeURIComponent("LINE account has no email. Please allow email access in LINE settings.")}`,
        );
      }

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
          `${origin}/auth/error?error=${encodeURIComponent("Failed to create account: " + (createError?.message || "unknown error"))}`,
        );
      }
      userId = newUser.user.id;
      userEmail = email;
    }

    // 4. Generate a magic link to create session
    const { data: linkData, error: linkError } =
      await admin.auth.admin.generateLink({
        type: "magiclink",
        email: userEmail!,
      });

    if (linkError || !linkData) {
      console.error("Failed to generate link:", linkError);
      return NextResponse.redirect(
        `${origin}/auth/error?error=${encodeURIComponent("Failed to create session: " + (linkError?.message || "unknown error"))}`,
      );
    }

    // Extract token hash from the generated link
    const tokenHash = linkData.properties.hashed_token;

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
        `${origin}/auth/error?error=${encodeURIComponent("Failed to create session: " + verifyError.message)}`,
      );
    }

    return response;
  } catch (err) {
    console.error("LINE callback error:", err);
    return NextResponse.redirect(
      `${origin}/auth/error?error=${encodeURIComponent("LINE callback error: " + (err instanceof Error ? err.message : String(err)))}`,
    );
  }
}
