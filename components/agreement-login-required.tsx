"use client";

import { useTranslations } from "next-intl";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import Link from "next/link";
import { LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AgreementLoginRequired({
  showLogin = true,
}: {
  showLogin?: boolean;
}) {
  const t = useTranslations();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("agreement.loginRequiredTitle")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground">
          {showLogin
            ? t("agreement.loginRequiredDescription")
            : t("agreement.partiesOnlyDescription")}
        </p>
        {showLogin && (
          <Button asChild>
            <Link href="/auth/login">
              <LogIn className="h-4 w-4 mr-1.5" />
              {t("common.login")}
            </Link>
          </Button>
        )}
        <div>
          <Link
            href="/"
            className="text-sm underline underline-offset-4"
          >
            {t("agreement.backToTop")}
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
