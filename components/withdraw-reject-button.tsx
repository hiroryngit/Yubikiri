"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { rejectWithdraw } from "@/app/actions/agreements";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

export function WithdrawRejectButton({ agreementId }: { agreementId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const t = useTranslations();

  async function handleReject() {
    if (!confirm(t("action.confirmWithdrawReject"))) return;
    setLoading(true);
    setError(null);
    const userAgent = navigator.userAgent;
    const result = await rejectWithdraw(agreementId, userAgent);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    } else {
      router.refresh();
    }
  }

  return (
    <div>
      <Button variant="outline" onClick={handleReject} disabled={loading}>
        {loading ? t("common.processing") : t("action.withdrawReject")}
      </Button>
      {error && <p className="text-sm text-destructive mt-2">{error}</p>}
    </div>
  );
}
