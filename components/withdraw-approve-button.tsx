"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { approveWithdraw } from "@/app/actions/agreements";

export function WithdrawApproveButton({ agreementId }: { agreementId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleApprove() {
    if (!confirm("取り下げを承認しますか？このお約束事は完全に削除されます。")) return;
    setLoading(true);
    setError(null);
    const userAgent = navigator.userAgent;
    const result = await approveWithdraw(agreementId, userAgent);
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
        {loading ? "処理中..." : "取り下げを承認"}
      </Button>
      {error && <p className="text-sm text-destructive mt-2">{error}</p>}
    </div>
  );
}
