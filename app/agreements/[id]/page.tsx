import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { toAgreement, toAgreementLog } from "@/lib/agreements";
import { decryptAgreement } from "@/lib/encryption";
import { generateUrlToken, hashUrlToken } from "@/lib/url-token";
import { AgreementDetail } from "@/components/agreement-detail";
import { AgreementNotFound } from "@/components/agreement-not-found";
import { AgreementLoginRequired } from "@/components/agreement-login-required";
import { headers } from "next/headers";
import { Suspense } from "react";
import type { AgreementRow, AgreementLogRow } from "@/types/database";

/**
 * URLトークンからagreementを検索する。
 * 1. トークンをハッシュして url_hash で検索
 * 2. 見つからない場合は旧URL互換のため id で検索し、url_hash をバックフィル
 */
async function findAgreement(token: string) {
  const supabase = await createClient();
  const urlHash = await hashUrlToken(token);

  // url_hash で検索
  const { data: row } = await supabase
    .from("agreements")
    .select("*")
    .eq("url_hash", urlHash)
    .single<AgreementRow>();

  if (row) return row;

  // 旧URL互換: UUID で検索（既存の共有リンク対応）
  const { data: legacyRow } = await supabase
    .from("agreements")
    .select("*")
    .eq("id", token)
    .single<AgreementRow>();

  if (legacyRow && !legacyRow.url_hash) {
    // バックフィル: url_hash を保存
    const legacyToken = await generateUrlToken(legacyRow.id);
    const legacyHash = await hashUrlToken(legacyToken);
    const admin = createAdminClient();
    await admin
      .from("agreements")
      .update({ url_hash: legacyHash })
      .eq("id", legacyRow.id);
  }

  return legacyRow;
}

async function AgreementContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: token } = await params;
  const row = await findAgreement(token);

  if (!row) {
    return <AgreementNotFound />;
  }

  const supabase = await createClient();

  const { data: logRows } = await supabase
    .from("agreement_logs")
    .select("*")
    .eq("agreement_id", row.id)
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
      return <AgreementLoginRequired showLogin={false} />;
    }
  }

  const { title, content } = await decryptAgreement(
    row.creator_id,
    row.creator_email,
    row,
  );
  const urlToken = await generateUrlToken(row.id);
  const agreement = toAgreement({ ...row, title, content }, urlToken);
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
