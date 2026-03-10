"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { FileText } from "lucide-react";

export function DashboardEmpty() {
  const t = useTranslations();

  return (
    <div className="text-center py-12 text-muted-foreground">
      <FileText className="h-12 w-12 mx-auto mb-4 opacity-30" />
      <p>{t("dashboard.empty")}</p>
      <p className="mt-2">
        <Link
          href="/agreements/new"
          className="text-primary underline"
        >
          {t("dashboard.emptyAction")}
        </Link>
        {t("dashboard.emptyActionSuffix")}
      </p>
    </div>
  );
}
