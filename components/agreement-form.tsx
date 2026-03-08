"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createAgreement } from "@/app/actions/agreements";
import { useActionState } from "react";

export function AgreementForm() {
  const [state, formAction, pending] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) => {
      const result = await createAgreement(formData);
      return result ?? null;
    },
    null,
  );

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

      <div className="space-y-2">
        <Label htmlFor="targetEmail">相手のメールアドレス（任意）</Label>
        <Input
          id="targetEmail"
          name="targetEmail"
          type="email"
          placeholder="未入力の場合はURLで共有できます"
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
