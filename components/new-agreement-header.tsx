"use client";

import { useTranslations } from "next-intl";

export function NewAgreementHeader({ variant = "public" }: { variant?: "public" | "protected" }) {
  const t = useTranslations();

  const title = variant === "protected"
    ? t("agreement.newTitleProtected")
    : t("agreement.newTitle");
  const desc = variant === "protected"
    ? t("agreement.newDescriptionProtected")
    : t("agreement.newDescription");

  return (
    <div className="space-y-2">
      <h1 className="font-bold text-xl sm:text-2xl">{title}</h1>
      <p className="text-sm sm:text-base text-muted-foreground">{desc}</p>
    </div>
  );
}
