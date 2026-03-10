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
    if (!confirm("このお約束事の取り下げを申請しますか？\n相手が承認するまで取り下げは完了しません。\n（まだ誰も関わっていない場合は即削除されます）")) {
      return;
    }
    setLoading(true);
    setError(null);
    const userAgent = navigator.userAgent;
    const result = await withdrawAgreement(agreementId, userAgent);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    } else if (result?.deleted) {
      window.location.href = "/protected";
    } else {
      router.refresh();
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
