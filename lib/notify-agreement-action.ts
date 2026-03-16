import { createAdminClient } from "@/lib/supabase/admin";
import { decryptAgreement } from "@/lib/encryption";
import { generateUrlToken } from "@/lib/url-token";
import { sendPushToUser } from "@/lib/push-sender";
import type { AgreementRow } from "@/types/database";

const ACTION_LABELS: Record<string, string> = {
  accept: "が合意しました",
  reject: "が拒否しました",
  rerequest: "が再申請しました",
  edit: "が編集（再申請）しました",
  withdraw_request: "が取り下げを申請しました",
  withdraw_approve: "が取り下げを承認しました",
  withdraw_reject: "が取り下げを拒否しました",
  revoke_request: "が解除を申請しました",
  revoke_approve: "が解除を承認しました",
  revoke_reject: "が解除を拒否しました",
};

/**
 * 同意書のアクション後に関係者へPush通知を送信する。
 * 失敗してもエラーは握りつぶす（通知は best-effort）。
 */
export async function notifyAgreementAction(
  agreementId: string,
  actionType: string,
  actorId: string,
  actorEmail: string,
) {
  try {
    const admin = createAdminClient();

    const { data: row } = await admin
      .from("agreements")
      .select("*")
      .eq("id", agreementId)
      .single<AgreementRow>();

    if (!row) return;

    // タイトルを復号
    const { title } = await decryptAgreement(
      row.creator_id,
      row.creator_email,
      row,
    );

    const truncatedTitle =
      title.length > 40 ? title.slice(0, 40) + "..." : title;

    const label = ACTION_LABELS[actionType] || "が操作しました";
    const body = `${actorEmail} ${label}\n「${truncatedTitle}」`;

    // URLトークンを生成
    const urlToken = await generateUrlToken(row.id);
    const url = `/agreements/${urlToken}`;

    // 通知先を決定: アクターでない当事者に送信
    const recipientIds: string[] = [];

    // 作成者が操作 → 合意者に通知 / 合意者が操作 → 作成者に通知
    if (actorId === row.creator_id) {
      // 合意者（acceptログのactor）を探す
      const { data: logs } = await admin
        .from("agreement_logs")
        .select("actor_id")
        .eq("agreement_id", agreementId)
        .eq("action_type", "accept")
        .limit(1);
      if (logs && logs.length > 0) {
        recipientIds.push(logs[0].actor_id);
      }
    } else {
      recipientIds.push(row.creator_id);
    }

    // 通知送信
    await Promise.allSettled(
      recipientIds.map((userId) =>
        sendPushToUser(userId, { title: "Yubikiri", body, url }),
      ),
    );
  } catch {
    // 通知失敗は握りつぶす
  }
}
