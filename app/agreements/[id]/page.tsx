import { createClient } from "@/lib/supabase/server";
import { toAgreement, toAgreementLog } from "@/lib/agreements";
import { decryptAgreement } from "@/lib/encryption";
import { AgreementDetail } from "@/components/agreement-detail";
import { AgreementNotFound } from "@/components/agreement-not-found";
import { AgreementLoginRequired } from "@/components/agreement-login-required";
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

  const logs = logRows ?? [];
  const hasBeenAccepted = logs.some((l) => l.action_type === "accept");

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 承認済みの同意書は当事者のみ閲覧可能
  if (hasBeenAccepted) {
    if (!user) {
      return <AgreementLoginRequired />;
    }

    const isCreator = user.id === row.creator_id;
    const isTarget =
      row.target_email !== null && row.target_email === user.email;
    const hasActed = logs.some((l) => l.actor_id === user.id);

    if (!isCreator && !isTarget && !hasActed) {
      return <AgreementNotFound />;
    }
  }

  const { title, content } = await decryptAgreement(
    row.creator_id,
    row.creator_email,
    row,
  );
  const agreement = toAgreement({ ...row, title, content });
  const agreementLogs = logs.map(toAgreementLog);

  const headersList = await headers();
  const host = headersList.get("host") ?? "localhost:3000";
  const proto = headersList.get("x-forwarded-proto") ?? "https";
  const origin = `${proto}://${host}`;

  return (
    <AgreementDetail
      agreement={agreement}
      logs={agreementLogs}
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
