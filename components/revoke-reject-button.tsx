"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { rejectRevoke } from "@/app/actions/agreements";
import { useRouter } from "next/navigation";

export function RevokeRejectButton({ agreementId }: { agreementId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleReject() {
    if (!confirm("合意の解除を拒否しますか？")) return;
    setLoading(true);
    setError(null);
    const userAgent = navigator.userAgent;
    const result = await rejectRevoke(agreementId, userAgent);
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
        {loading ? "処理中..." : "解除を拒否"}
      </Button>
      {error && <p className="text-sm text-destructive mt-2">{error}</p>}
    </div>
  );
}
