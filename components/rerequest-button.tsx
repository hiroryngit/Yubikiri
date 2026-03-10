"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { rerequestAgreement } from "@/app/actions/agreements";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { RefreshCw } from "lucide-react";

export function RerequestButton({ agreementId }: { agreementId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const t = useTranslations();

  async function handleRerequest() {
    if (!confirm(t("action.confirmRerequest"))) return;
    setLoading(true);
    setError(null);
    const userAgent = navigator.userAgent;
    const result = await rerequestAgreement(agreementId, userAgent);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    } else {
      router.refresh();
    }
  }

  return (
    <div>
      <Button variant="outline" onClick={handleRerequest} disabled={loading}>
        <RefreshCw className="h-4 w-4 mr-1" />
        {loading ? t("common.processing") : t("action.rerequest")}
      </Button>
      {error && <p className="text-sm text-destructive mt-2">{error}</p>}
    </div>
  );
}
