import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { toAgreement } from "@/lib/agreements";
import { AgreementCard } from "@/components/agreement-card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Suspense } from "react";
import type { AgreementRow } from "@/types/database";

async function AgreementList() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // 自分が関与した agreement_logs から agreement_id を取得
  const { data: logRows } = await supabase
    .from("agreement_logs")
    .select("agreement_id")
    .eq("actor_id", user.id);

  const actedIds = (logRows ?? []).map((r) => r.agreement_id);

  // 自分が作成 or target_email 一致 or ログに参加した同意書を取得
  let query = supabase
    .from("agreements")
    .select("*")
    .order("created_at", { ascending: false });

  if (actedIds.length > 0) {
    query = query.or(
      `creator_id.eq.${user.id},target_email.eq.${user.email},id.in.(${actedIds.join(",")})`,
    );
  } else {
    query = query.or(`creator_id.eq.${user.id},target_email.eq.${user.email}`);
  }

  const { data: rows } = await query.returns<AgreementRow[]>();

  const agreements = (rows ?? []).map(toAgreement);

  if (agreements.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>まだ同意書がありません。</p>
        <p className="mt-2">
          <Link
            href="/agreements/new"
            className="text-primary underline"
          >
            最初の同意書を作成
          </Link>
          しましょう。
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {agreements.map((agreement) => (
        <AgreementCard key={agreement.id} agreement={agreement} />
      ))}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <div className="flex-1 w-full flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <h1 className="font-bold text-2xl">ダッシュボード</h1>
        <Button asChild>
          <Link href="/agreements/new">同意書を作成</Link>
        </Button>
      </div>

      <Suspense
        fallback={<p className="text-muted-foreground">読み込み中...</p>}
      >
        <AgreementList />
      </Suspense>
    </div>
  );
}
