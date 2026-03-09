"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createAgreement } from "@/app/actions/agreements";
import { createClient } from "@/lib/supabase/client";
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
      sessionStorage.removeItem(DRAFT_KEY);
      setTitle(t);
      setContent(c);
      // クライアント側で認証を確認してから送信
      waitForAuthAndSubmit(t, c);
    }
  }, []);

  async function waitForAuthAndSubmit(t: string, c: string) {
    setPending(true);
    setError(null);

    const supabase = createClient();

    // セッションが確立するまで最大5秒待つ
    for (let i = 0; i < 10; i++) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // 認証OK → サーバーアクション実行
        await doCreate(t, c);
        return;
      }
      await new Promise((r) => setTimeout(r, 500));
    }

    // 5秒待ってもログインできていない
    setError("ログインが完了していません。ページをリロードしてもう一度お試しください。");
    setPending(false);
  }

  async function doCreate(t: string, c: string) {
    setPending(true);
    setError(null);

    const formData = new FormData();
    formData.set("title", t);
    formData.set("content", c);

    const result = await createAgreement(formData);

    if (result && "error" in result) {
      if (result.error === "login_required") {
        setError("セッションが切れています。ページをリロードしてもう一度お試しください。");
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

    // まずクライアント側で認証チェック
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      // 未ログイン: 下書き保存してログインへ
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ title, content }));
      router.push("/auth/login?redirect=/agreements/new");
      return;
    }

    await doCreate(title, content);
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
