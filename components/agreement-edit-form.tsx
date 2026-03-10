"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { editAgreement } from "@/app/actions/agreements";
import { useTranslations } from "next-intl";
import { useCustomValidity } from "@/lib/use-custom-validity";

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
  const t = useTranslations();
  const validity = useCustomValidity();

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
        {t("agreement.editWarning")}
      </p>

      <div className="space-y-2">
        <Label htmlFor="edit-title">{t("agreement.titleLabel")}</Label>
        <Input
          id="edit-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          onInvalid={validity.onInvalid}
          onInput={validity.onInput}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="edit-content">{t("agreement.contentLabel")}</Label>
        <textarea
          id="edit-content"
          className="flex min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
          onInvalid={validity.onInvalid}
          onInput={validity.onInput}
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? t("agreement.saving") : t("agreement.saveAndRerequest")}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={pending}>
          {t("common.cancel")}
        </Button>
      </div>
    </form>
  );
}
