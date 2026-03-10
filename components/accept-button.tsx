"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { acceptAgreement } from "@/app/actions/agreements";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

export function AcceptButton({ agreementId }: { agreementId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const t = useTranslations();

  async function handleAccept() {
    setLoading(true);
    setError(null);
    const userAgent = navigator.userAgent;
    const result = await acceptAgreement(agreementId, userAgent);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    } else {
      router.refresh();
    }
  }

  return (
    <div>
      <Button onClick={handleAccept} disabled={loading}>
        {loading ? t("common.processing") : t("action.accept")}
      </Button>
      {error && <p className="text-sm text-destructive mt-2">{error}</p>}
    </div>
  );
}
