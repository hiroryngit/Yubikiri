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
import { RichTextContent } from "@/components/rich-text-content";
import type { Agreement } from "@/types/database";
import { useTranslations, useLocale } from "next-intl";
import { useEffect, useState, useRef } from "react";
import { Languages } from "lucide-react";

export function AgreementCard({ agreement }: { agreement: Agreement }) {
  const t = useTranslations();
  const locale = useLocale();
  const [translated, setTranslated] = useState<{ title: string; content: string } | null>(null);
  const [showTranslation, setShowTranslation] = useState(false);
  const [translating, setTranslating] = useState(false);
  const autoTranslated = useRef(false);

  const needsTranslation = agreement.originalLocale !== locale;

  // 言語が異なる場合はマウント時に自動翻訳
  useEffect(() => {
    if (!needsTranslation || autoTranslated.current) return;
    autoTranslated.current = true;

    setTranslating(true);
    fetch("/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: agreement.title,
        content: agreement.content,
        targetLocale: locale,
      }),
    })
      .then(async (res) => {
        if (!res.ok) throw new Error();
        const data = await res.json();
        setTranslated(data);
        setShowTranslation(true);
      })
      .catch(() => {
        // 翻訳失敗時は原文のまま表示
      })
      .finally(() => setTranslating(false));
  }, [needsTranslation, agreement.title, agreement.content, locale]);

  function handleToggleTranslation(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!translated) return;
    setShowTranslation((v) => !v);
  }

  const displayTitle = showTranslation && translated ? translated.title : agreement.title;
  const displayContent = showTranslation && translated ? translated.content : agreement.content;

  return (
    <Link href={`/agreements/${agreement.id}`}>
      <Card className="hover:bg-accent/50 transition-colors">
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-lg leading-tight">{displayTitle}</CardTitle>
            <div className="flex items-center gap-1.5 shrink-0">
              {needsTranslation && translated && (
                <button
                  onClick={handleToggleTranslation}
                  className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded"
                  title={showTranslation ? t("agreement.showOriginal") : t("agreement.translate")}
                >
                  <Languages className={`h-4 w-4 ${showTranslation ? "text-primary" : ""}`} />
                </button>
              )}
              {translating && (
                <Languages className="h-4 w-4 text-muted-foreground animate-pulse" />
              )}
              <AgreementStatusBadge status={agreement.status} />
            </div>
          </div>
          <CardDescription className="font-mono text-xs truncate">
            {`/agreements/${agreement.id}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground line-clamp-2">
            <RichTextContent html={displayContent} />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {t("dashboard.createdAt")}: {new Date(agreement.createdAt).toLocaleDateString(locale)}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
