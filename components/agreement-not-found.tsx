"use client";

import { useTranslations } from "next-intl";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import Link from "next/link";

export function AgreementNotFound() {
  const t = useTranslations();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("agreement.notFoundTitle")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground">
          {t("agreement.notFound")}
        </p>
        <Link
          href="/"
          className="text-sm underline underline-offset-4"
        >
          {t("agreement.backToTop")}
        </Link>
      </CardContent>
    </Card>
  );
}
