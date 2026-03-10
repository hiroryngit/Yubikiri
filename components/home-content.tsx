"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { FilePlus, LayoutDashboard } from "lucide-react";

export function HomeContent() {
  const t = useTranslations();

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-8 max-w-2xl px-5 text-center">
      <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
        {t("home.hero")}
      </h1>
      <p className="text-lg text-muted-foreground max-w-lg">
        {t("home.description")}
      </p>
      <div className="flex gap-4">
        <Button asChild size="lg">
          <Link href="/agreements/new"><FilePlus className="h-4 w-4 mr-2" />{t("home.createButton")}</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/protected"><LayoutDashboard className="h-4 w-4 mr-2" />{t("home.dashboardButton")}</Link>
        </Button>
      </div>
    </div>
  );
}
