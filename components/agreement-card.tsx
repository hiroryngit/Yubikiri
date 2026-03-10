"use client";

import Link from "next/link";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { AgreementStatusBadge } from "@/components/agreement-status-badge";
import type { Agreement } from "@/types/database";
import { useTranslations, useLocale } from "next-intl";

export function AgreementCard({ agreement }: { agreement: Agreement }) {
  const t = useTranslations();
  const locale = useLocale();

  return (
    <Link href={`/agreements/${agreement.id}`}>
      <Card className="hover:bg-accent/50 transition-colors">
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-lg leading-tight">{agreement.title}</CardTitle>
            <AgreementStatusBadge status={agreement.status} />
          </div>
          <CardDescription className="font-mono text-xs truncate">
            {`/agreements/${agreement.id}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {agreement.content}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            {t("dashboard.createdAt")}: {new Date(agreement.createdAt).toLocaleDateString(locale)}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
