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

export function AgreementLoginRequired() {
  const t = useTranslations();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("agreement.loginRequiredTitle")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground">
          {t("agreement.loginRequiredDescription")}
        </p>
        <Button asChild>
          <Link href="/auth/login">
            <LogIn className="h-4 w-4 mr-1.5" />
            {t("common.login")}
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
