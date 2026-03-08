"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { revokeAgreement } from "@/app/actions/agreements";
import { useRouter } from "next/navigation";

export function RevokeButton({ agreementId }: { agreementId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleRevoke() {
    setLoading(true);
    setError(null);
    const userAgent = navigator.userAgent;
    const result = await revokeAgreement(agreementId, userAgent);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    } else {
      router.refresh();
    }
  }

  return (
    <div>
      <Button variant="destructive" onClick={handleRevoke} disabled={loading}>
        {loading ? "処理中..." : "合意を解除する"}
      </Button>
      {error && <p className="text-sm text-destructive mt-2">{error}</p>}
    </div>
  );
}
