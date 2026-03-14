"use client";

import { cn, getBaseUrl } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { pushReturnUrl, hasReturnUrl } from "@/lib/return-stack";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { GoogleIcon } from "@/components/google-icon";
import { DiscordIcon } from "@/components/discord-icon";
import Image from "next/image";

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const t = useTranslations();

  useEffect(() => {
    const redirect = searchParams.get("redirect");
    if (redirect && !hasReturnUrl()) {
      pushReturnUrl(redirect);
    }
  }, [searchParams]);

  const handleOAuthLogin = async (provider: "google" | "discord") => {
    const supabase = createClient();
    setError(null);

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${getBaseUrl()}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
    }
  };

  const handleLineLogin = () => {
    const channelId = process.env.NEXT_PUBLIC_LINE_CHANNEL_ID;
    const redirectUri = encodeURIComponent(`${getBaseUrl()}/auth/callback/line`);
    const state = crypto.randomUUID();
    sessionStorage.setItem("line_oauth_state", state);
    const url = `https://access.line.me/oauth2/v2.1/authorize?response_type=code&client_id=${channelId}&redirect_uri=${redirectUri}&state=${state}&scope=profile%20openid%20email`;
    window.location.href = url;
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{t("auth.loginTitle")}</CardTitle>
          <CardDescription>
            {t("auth.loginDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3">
            {error && <p className="text-sm text-red-500">{error}</p>}
            {([
              { key: "google", icon: <GoogleIcon />, label: t("auth.googleLogin"), onClick: () => handleOAuthLogin("google") },
              { key: "line", icon: <Image src="/icons8-line.svg" alt="LINE" width={16} height={16} />, label: t("auth.lineLogin"), onClick: handleLineLogin },
              { key: "discord", icon: <DiscordIcon />, label: t("auth.discordLogin"), onClick: () => handleOAuthLogin("discord") },
            ] as const).map((item) => (
              <Button
                key={item.key}
                variant="outline"
                className="w-full"
                onClick={item.onClick}
              >
                <span className="grid grid-cols-[20px_1fr] items-center gap-3 w-48">
                  <span className="flex justify-center">{item.icon}</span>
                  <span className="text-left">{item.label}</span>
                </span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
