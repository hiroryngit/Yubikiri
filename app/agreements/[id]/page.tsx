import { createClient } from "@/lib/supabase/server";
import { toAgreement, toAgreementLog } from "@/lib/agreements";
import { decryptAgreement } from "@/lib/encryption";
import { AgreementDetail } from "@/components/agreement-detail";
import { AgreementNotFound } from "@/components/agreement-not-found";
import { headers } from "next/headers";
import { Suspense } from "react";
import type { AgreementRow, AgreementLogRow } from "@/types/database";

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
    return <AgreementNotFound />;
  }

  const { data: logRows } = await supabase
    .from("agreement_logs")
    .select("*")
    .eq("agreement_id", id)
    .order("recorded_at", { ascending: true })
    .returns<AgreementLogRow[]>();

  const { title, content } = await decryptAgreement(
    row.creator_id,
    row.creator_email,
    row,
  );
  const agreement = toAgreement({ ...row, title, content });
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
    <Suspense fallback={<p className="text-muted-foreground">...</p>}>
      <AgreementContent params={params} />
    </Suspense>
  );
}
