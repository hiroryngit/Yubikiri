"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { rejectAgreement } from "@/app/actions/agreements";
import { useRouter } from "next/navigation";

export function RejectButton({ agreementId }: { agreementId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleReject() {
    setLoading(true);
    setError(null);
    const userAgent = navigator.userAgent;
    const result = await rejectAgreement(agreementId, userAgent);
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
        {loading ? "処理中..." : "拒否する"}
      </Button>
      {error && <p className="text-sm text-destructive mt-2">{error}</p>}
    </div>
  );
}
