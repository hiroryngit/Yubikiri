"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createAgreement } from "@/app/actions/agreements";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const DRAFT_KEY = "yubikiri_draft";

export function AgreementForm() {
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const router = useRouter();
  const autoSubmitted = useRef(false);

  // ログイン後に戻ってきたら保存済みの下書きを復元して自動送信
  useEffect(() => {
    const draft = sessionStorage.getItem(DRAFT_KEY);
    if (draft && !autoSubmitted.current) {
      autoSubmitted.current = true;
      const { title: t, content: c } = JSON.parse(draft);
      // 下書きは即削除（ループ防止）
      sessionStorage.removeItem(DRAFT_KEY);
      // フォームに値を復元
      setTitle(t);
      setContent(c);
      // セッションが確立するまで少し待ってから送信
      setTimeout(() => submitAgreement(t, c, true), 500);
    }
  }, []);

  async function submitAgreement(t: string, c: string, isAutoRetry = false) {
    setPending(true);
    setError(null);

    const formData = new FormData();
    formData.set("title", t);
    formData.set("content", c);

    const result = await createAgreement(formData);

    if (result && "error" in result) {
      if (result.error === "login_required") {
        if (isAutoRetry) {
          // 自動送信でもログインできていない場合はフォームに値を残してエラー表示
          setError("ログインが必要です。下のボタンからログインしてください。");
          setPending(false);
          return;
        }
        // 手動送信: 下書きを保存してログインへ
        sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ title: t, content: c }));
        setPending(false);
        router.push("/auth/login?redirect=/agreements/new");
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
    await submitAgreement(title, content);
  }

  if (shareUrl) {
    return (
      <div className="space-y-4">
        <p className="text-sm font-medium text-green-600">
          同意書を作成しました！以下のURLを相手に共有してください。
        </p>
        <div className="flex items-center gap-2">
          <Input value={shareUrl} readOnly className="font-mono text-xs" />
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              navigator.clipboard.writeText(shareUrl);
            }}
          >
            コピー
          </Button>
        </div>
        <div className="flex gap-2">
          <Link
            href={shareUrl}
            className="text-sm underline underline-offset-4"
          >
            同意書を確認する
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">タイトル</Label>
        <Input
          id="title"
          name="title"
          placeholder="例: 書籍の貸し借りについて"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="content">内容</Label>
        <textarea
          id="content"
          name="content"
          className="flex min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          placeholder="合意の内容を記載してください"
          required
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" disabled={pending}>
        {pending ? "作成中..." : "同意書を作成"}
      </Button>
    </form>
  );
}
