"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
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
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { useCustomValidity } from "@/lib/use-custom-validity";
import { Mail, Lock, UserPlus } from "lucide-react";

export function SignUpForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const t = useTranslations();
  const validity = useCustomValidity();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    if (password !== repeatPassword) {
      setError(t("auth.passwordMismatch"));
      setIsLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/protected`,
        },
      });
      if (error) throw error;
      router.push("/auth/sign-up-success");
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{t("auth.signUpTitle")}</CardTitle>
          <CardDescription>{t("auth.signUpDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignUp}>
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
              <div className="grid gap-2">
                <Label htmlFor="repeat-password" className="flex items-center gap-1.5"><Lock className="h-3.5 w-3.5" />{t("auth.repeatPassword")}</Label>
                <Input
                  id="repeat-password"
                  type="password"
                  required
                  value={repeatPassword}
                  onChange={(e) => setRepeatPassword(e.target.value)}
                  onInvalid={validity.onInvalid}
                  onInput={validity.onInput}
                />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <Button type="submit" className="w-full" disabled={isLoading}>
                <UserPlus className="h-4 w-4 mr-2" />
                {isLoading ? t("auth.signingUp") : t("common.signUp")}
              </Button>
            </div>
            <div className="mt-6 text-center text-sm">
              {t("auth.hasAccount")}{" "}
              <Link href="/auth/login" className="underline underline-offset-4">
                {t("common.login")}
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
