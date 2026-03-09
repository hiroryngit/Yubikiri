"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { withdrawAgreement } from "@/app/actions/agreements";
import { useRouter } from "next/navigation";

export function WithdrawButton({ agreementId }: { agreementId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleWithdraw() {
    if (!confirm("この同意書を取り下げますか？取り下げると完全に削除されます。")) {
      return;
    }
    setLoading(true);
    setError(null);
    const result = await withdrawAgreement(agreementId);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    } else {
      router.push("/protected");
    }
  }

  return (
    <div>
      <Button variant="destructive" onClick={handleWithdraw} disabled={loading}>
        {loading ? "処理中..." : "取り下げる"}
      </Button>
      {error && <p className="text-sm text-destructive mt-2">{error}</p>}
    </div>
  );
}
