"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { popReturnUrl, pushReturnUrl, hasReturnUrl } from "@/lib/return-stack";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useCustomValidity } from "@/lib/use-custom-validity";
import { GoogleIcon } from "@/components/google-icon";
import { Mail, Lock, LogIn } from "lucide-react";

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations();
  const validity = useCustomValidity();

  useEffect(() => {
    const redirect = searchParams.get("redirect");
    if (redirect && !hasReturnUrl()) {
      pushReturnUrl(redirect);
    }
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;

      const returnUrl = popReturnUrl() || "/";
      router.push(returnUrl);
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    const supabase = createClient();
    setError(null);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
    }
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
          <form onSubmit={handleLogin}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="email" className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" />{t("auth.email")}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onInvalid={validity.onInvalid}
                  onInput={validity.onInput}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password" className="flex items-center gap-1.5"><Lock className="h-3.5 w-3.5" />{t("auth.password")}</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onInvalid={validity.onInvalid}
                  onInput={validity.onInput}
                />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <Button type="submit" className="w-full" disabled={isLoading}>
                <LogIn className="h-4 w-4 mr-2" />
                {isLoading ? t("auth.loggingIn") : t("common.login")}
              </Button>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">{t("common.or")}</span>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleGoogleLogin}
              >
                <GoogleIcon className="mr-2" />
                {t("auth.googleLogin")}
              </Button>
            </div>
            <div className="mt-6 space-y-3 text-center text-sm">
              <div>
                <Link
                  href="/auth/forgot-password"
                  className="text-muted-foreground underline-offset-4 hover:underline"
                >
                  {t("auth.forgotPassword")}
                </Link>
              </div>
              <div>
                {t("auth.noAccount")}{" "}
                <Link
                  href="/auth/sign-up"
                  className="underline underline-offset-4"
                >
                  {t("common.signUp")}
                </Link>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
