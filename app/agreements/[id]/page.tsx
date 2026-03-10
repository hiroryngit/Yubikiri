import { createClient } from "@/lib/supabase/server";
import { toAgreement, toAgreementLog } from "@/lib/agreements";
import { AgreementDetail } from "@/components/agreement-detail";
import { headers } from "next/headers";
import { Suspense } from "react";
import type { AgreementRow, AgreementLogRow } from "@/types/database";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import Link from "next/link";

async function AgreementContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: row, error } = await supabase
    .from("agreements")
    .select("*")
    .eq("id", id)
    .single<AgreementRow>();

  if (error || !row) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>アクセスできません</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            このお約束事は取り下げられたか、存在しないURLです。
          </p>
          <Link
            href="/"
            className="text-sm underline underline-offset-4"
          >
            トップページに戻る
          </Link>
        </CardContent>
      </Card>
    );
  }

  const { data: logRows } = await supabase
    .from("agreement_logs")
    .select("*")
    .eq("agreement_id", id)
    .order("recorded_at", { ascending: true })
    .returns<AgreementLogRow[]>();

  const agreement = toAgreement(row);
  const logs = (logRows ?? []).map(toAgreementLog);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const headersList = await headers();
  const host = headersList.get("host") ?? "localhost:3000";
  const proto = headersList.get("x-forwarded-proto") ?? "https";
  const origin = `${proto}://${host}`;

  return (
    <AgreementDetail
      agreement={agreement}
      logs={logs}
      currentUserEmail={user?.email ?? null}
      currentUserId={user?.id ?? null}
      isAuthenticated={!!user}
      origin={origin}
    />
  );
}

export default function AgreementPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense
      fallback={<p className="text-muted-foreground">読み込み中...</p>}
    >
      <AgreementContent params={params} />
    </Suspense>
  );
}
