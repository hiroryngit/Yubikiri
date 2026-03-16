"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/notification-bell";
import Link from "next/link";
import { Plus } from "lucide-react";

export function DashboardHeader() {
  const t = useTranslations();

  return (
    <div className="flex items-center justify-between gap-3">
      <h1 className="font-bold text-xl sm:text-2xl">{t("dashboard.title")}</h1>
      <div className="flex items-center gap-1">
        <NotificationBell />
        <Button asChild>
          <Link href="/agreements/new"><Plus className="h-4 w-4 mr-1" />{t("dashboard.createButton")}</Link>
        </Button>
      </div>
    </div>
  );
}
