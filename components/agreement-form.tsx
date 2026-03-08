"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createAgreement } from "@/app/actions/agreements";
import { useActionState, useState } from "react";
import Link from "next/link";

export function AgreementForm() {
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [state, formAction, pending] = useActionState(
    async (
      _prev: { error?: string; agreementId?: string } | null,
      formData: FormData,
    ) => {
      const result = await createAgreement(formData);
      if (result && "agreementId" in result) {
        const url = `${window.location.origin}/agreements/${result.agreementId}`;
        setShareUrl(url);
      }
      return result ?? null;
    },
    null,
  );

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
          <Link href={shareUrl} className="text-sm underline underline-offset-4">
            同意書を確認する
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">タイトル</Label>
        <Input
          id="title"
          name="title"
          placeholder="例: 書籍の貸し借りについて"
          required
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
        />
      </div>

      {state?.error && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? "作成中..." : "同意書を作成"}
      </Button>
    </form>
  );
}
