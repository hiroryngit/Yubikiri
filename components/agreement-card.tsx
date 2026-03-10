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
import { useState } from "react";
import { Languages } from "lucide-react";

export function AgreementCard({ agreement }: { agreement: Agreement }) {
  const t = useTranslations();
  const locale = useLocale();
  const [translated, setTranslated] = useState<{ title: string; content: string } | null>(null);
  const [showTranslation, setShowTranslation] = useState(false);
  const [translating, setTranslating] = useState(false);

  async function handleTranslate(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (translated) {
      setShowTranslation((v) => !v);
      return;
    }
    setTranslating(true);
    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: agreement.title, content: agreement.content, targetLocale: locale }),
      });
      const text = await res.text();
      if (!res.ok || !text) throw new Error("failed");
      const data = JSON.parse(text);
      setTranslated(data);
      setShowTranslation(true);
    } catch {
      // silently fail on card
    } finally {
      setTranslating(false);
    }
  }

  const canTranslate = agreement.originalLocale !== locale;
  const displayTitle = showTranslation && translated ? translated.title : agreement.title;
  const displayContent = showTranslation && translated ? translated.content : agreement.content;

  return (
    <Link href={`/agreements/${agreement.id}`}>
      <Card className="hover:bg-accent/50 transition-colors">
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-lg leading-tight">{displayTitle}</CardTitle>
            <div className="flex items-center gap-1.5 shrink-0">
              {canTranslate && (
                <button
                  onClick={handleTranslate}
                  className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded"
                  title={showTranslation ? t("agreement.showOriginal") : t("agreement.translate")}
                >
                  <Languages className={`h-4 w-4 ${translating ? "animate-pulse" : ""} ${showTranslation ? "text-primary" : ""}`} />
                </button>
              )}
              <AgreementStatusBadge status={agreement.status} />
            </div>
          </div>
          <CardDescription className="font-mono text-xs truncate">
            {`/agreements/${agreement.id}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {displayContent}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            {t("dashboard.createdAt")}: {new Date(agreement.createdAt).toLocaleDateString(locale)}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
