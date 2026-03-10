"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { approveRevoke } from "@/app/actions/agreements";
import { useTranslations } from "next-intl";

export function RevokeApproveButton({ agreementId }: { agreementId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const t = useTranslations();

  async function handleApprove() {
    if (!confirm(t("action.confirmRevokeApprove"))) return;
    setLoading(true);
    setError(null);
    const userAgent = navigator.userAgent;
    const result = await approveRevoke(agreementId, userAgent);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    } else {
      window.location.href = "/protected";
    }
  }

  return (
    <div>
      <Button variant="destructive" onClick={handleApprove} disabled={loading}>
        {loading ? t("common.processing") : t("action.revokeApprove")}
      </Button>
      {error && <p className="text-sm text-destructive mt-2">{error}</p>}
    </div>
  );
}
