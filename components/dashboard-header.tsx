"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function DashboardHeader() {
  const t = useTranslations();

  return (
    <div className="flex items-center justify-between">
      <h1 className="font-bold text-2xl">{t("dashboard.title")}</h1>
      <Button asChild>
        <Link href="/agreements/new">{t("dashboard.createButton")}</Link>
      </Button>
    </div>
  );
}
