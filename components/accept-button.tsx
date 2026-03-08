"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { acceptAgreement } from "@/app/actions/agreements";
import { useRouter } from "next/navigation";

export function AcceptButton({ agreementId }: { agreementId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

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
        {loading ? "処理中..." : "合意する"}
      </Button>
      {error && <p className="text-sm text-destructive mt-2">{error}</p>}
    </div>
  );
}
