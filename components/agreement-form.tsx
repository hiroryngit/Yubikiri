"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createAgreement } from "@/app/actions/agreements";
import { createClient } from "@/lib/supabase/client";
import { pushReturnUrl, popReturnUrl, hasReturnUrl } from "@/lib/return-stack";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CopyButton } from "@/components/copy-button";
import { useTranslations, useLocale } from "next-intl";
import { useCustomValidity } from "@/lib/use-custom-validity";

const DRAFT_KEY = "yubikiri_draft";

export function AgreementForm() {
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const router = useRouter();
  const autoSubmitted = useRef(false);
  const t = useTranslations();
  const locale = useLocale();
  const validity = useCustomValidity();

  // ログイン後に戻ってきたら保存済みの下書きを復元して自動送信
  useEffect(() => {
    const draft = sessionStorage.getItem(DRAFT_KEY);
    if (draft && !autoSubmitted.current) {
      autoSubmitted.current = true;
      const { title: draftTitle, content: draftContent } = JSON.parse(draft);
      sessionStorage.removeItem(DRAFT_KEY);
      setTitle(draftTitle);
      setContent(draftContent);
      // 下書き復元時は return stack を消費しておく（AuthReturnHandler の重複リダイレクト防止）
      if (hasReturnUrl()) popReturnUrl();
      waitForAuthAndSubmit(draftTitle, draftContent);
    }
  }, []);

  async function waitForAuthAndSubmit(titleVal: string, contentVal: string) {
    setPending(true);
    setError(null);

    const supabase = createClient();

    for (let i = 0; i < 10; i++) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await doCreate(titleVal, contentVal);
        return;
      }
      await new Promise((r) => setTimeout(r, 500));
    }

    setError(t("agreement.loginNotComplete"));
    setPending(false);
  }

  async function doCreate(titleVal: string, contentVal: string) {
    setPending(true);
    setError(null);

    const formData = new FormData();
    formData.set("title", titleVal);
    formData.set("content", contentVal);
    formData.set("original_locale", locale);

    const result = await createAgreement(formData);

    if (result && "error" in result) {
      if (result.error === "login_required") {
        setError(t("agreement.sessionExpired"));
        setPending(false);
        return;
      }
      setError(result.error ?? null);
      setPending(false);
      return;
    }

    if (result && "agreementId" in result) {
      const url = `${window.location.origin}/agreements/${result.agreementId}`;
      setShareUrl(url);
    }
    setPending(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ title, content }));
      pushReturnUrl("/agreements/new");
      router.push("/auth/login");
      return;
    }

    await doCreate(title, content);
  }

  if (shareUrl) {
    return (
      <div className="space-y-4">
        <p className="text-sm font-medium text-green-600">
          {t("agreement.created")}
        </p>
        <div className="flex items-center gap-2">
          <Input value={shareUrl} readOnly className="font-mono text-xs" />
          <CopyButton text={shareUrl} />
        </div>
        <div className="flex gap-2">
          <Link
            href={shareUrl}
            className="text-sm underline underline-offset-4"
          >
            {t("agreement.viewDetail")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-7">
      <div className="space-y-2.5">
        <Label htmlFor="title">{t("agreement.titleLabel")}</Label>
        <Input
          id="title"
          name="title"
          placeholder={t("agreement.titlePlaceholder")}
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onInvalid={validity.onInvalid}
          onInput={validity.onInput}
        />
      </div>

      <div className="space-y-2.5">
        <Label htmlFor="content">{t("agreement.contentLabel")}</Label>
        <textarea
          id="content"
          name="content"
          className="flex min-h-[140px] w-full rounded-md border border-input bg-transparent px-3 py-2.5 text-base sm:text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          placeholder={t("agreement.contentPlaceholder")}
          required
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onInvalid={validity.onInvalid}
          onInput={validity.onInput}
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" disabled={pending}>
        {pending ? t("agreement.submitting") : t("agreement.submitButton")}
      </Button>
    </form>
  );
}
