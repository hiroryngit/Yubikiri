"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { editAgreement } from "@/app/actions/agreements";

type Props = {
  agreementId: string;
  initialTitle: string;
  initialContent: string;
  onCancel: () => void;
};

export function AgreementEditForm({
  agreementId,
  initialTitle,
  initialContent,
  onCancel,
}: Props) {
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);

    const formData = new FormData();
    formData.set("title", title);
    formData.set("content", content);

    const result = await editAgreement(agreementId, formData);

    if (result?.error) {
      setError(result.error);
      setPending(false);
      return;
    }

    window.location.reload();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-amber-600">
        保存すると再申請扱いになり、相手に再度承認を求めます。
      </p>

      <div className="space-y-2">
        <Label htmlFor="edit-title">タイトル</Label>
        <Input
          id="edit-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="edit-content">内容</Label>
        <textarea
          id="edit-content"
          className="flex min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "保存中..." : "保存して再申請"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={pending}>
          キャンセル
        </Button>
      </div>
    </form>
  );
}
