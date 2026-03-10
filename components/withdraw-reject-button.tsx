"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { rejectWithdraw } from "@/app/actions/agreements";
import { useRouter } from "next/navigation";

export function WithdrawRejectButton({ agreementId }: { agreementId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleReject() {
    if (!confirm("取り下げを拒否しますか？")) return;
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
        {loading ? "処理中..." : "取り下げを拒否"}
      </Button>
      {error && <p className="text-sm text-destructive mt-2">{error}</p>}
    </div>
  );
}
