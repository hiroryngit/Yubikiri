"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { withdrawAgreement } from "@/app/actions/agreements";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

export function WithdrawButton({ agreementId }: { agreementId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const t = useTranslations();

  async function handleWithdraw() {
    if (!confirm(t("action.confirmWithdraw"))) {
      return;
    }
    setLoading(true);
    setError(null);
    const userAgent = navigator.userAgent;
    const result = await withdrawAgreement(agreementId, userAgent);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    } else if (result?.deleted) {
      window.location.href = "/protected";
    } else {
      router.refresh();
    }
  }

  return (
    <div>
      <Button variant="destructive" onClick={handleWithdraw} disabled={loading}>
        {loading ? t("common.processing") : t("action.withdraw")}
      </Button>
      {error && <p className="text-sm text-destructive mt-2">{error}</p>}
    </div>
  );
}
