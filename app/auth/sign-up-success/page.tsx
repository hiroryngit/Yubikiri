"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useTranslations } from "next-intl";

export default function Page() {
  const t = useTranslations();

  return (
    <div className="flex min-h-svh w-full items-center justify-center px-4 py-8 sm:p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">
                {t("auth.signUpSuccessTitle")}
              </CardTitle>
              <CardDescription>{t("auth.signUpSuccessDescription")}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {t("auth.signUpSuccessMessage")}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
