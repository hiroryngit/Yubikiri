"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { rerequestAgreement } from "@/app/actions/agreements";
import { useRouter } from "next/navigation";

export function RerequestButton({ agreementId }: { agreementId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleRerequest() {
    if (!confirm("この同意書を再申請しますか？")) return;
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
        {loading ? "処理中..." : "再申請する"}
      </Button>
      {error && <p className="text-sm text-destructive mt-2">{error}</p>}
    </div>
  );
}
