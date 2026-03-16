"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateContentHash } from "@/lib/agreements";
import { encryptAgreement } from "@/lib/encryption";
import { generateUrlToken, hashUrlToken } from "@/lib/url-token";
import { getRequestInfo } from "@/lib/request-info";
import { notifyAgreementAction } from "@/lib/notify-agreement-action";

/** 認証済みユーザーを取得。未認証ならnull */
async function getAuthUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function createAgreement(formData: FormData) {
  const user = await getAuthUser();
  if (!user) return { error: "login_required" };

  const title = formData.get("title") as string;
  const content = formData.get("content") as string;
  const originalLocale = (formData.get("original_locale") as string) || "ja";

  if (!title || !content) {
    return { error: "タイトルと内容を入力してください" };
  }

  const admin = createAdminClient();
  const contentHash = await generateContentHash(content);
  const { encTitle, titleIv, encContent, contentIv } =
    await encryptAgreement(user.id, user.email!, title, content);

  const { data, error } = await admin
    .from("agreements")
    .insert({
      title: encTitle,
      content: encContent,
      content_hash: contentHash,
      creator_id: user.id,
      creator_email: user.email!,
      original_locale: originalLocale,
      title_iv: titleIv,
      content_iv: contentIv,
      is_encrypted: true,
    })
    .select("id")
    .single();

  if (error) {
    return { error: "お約束事の作成に失敗しました" };
  }

  // URLトークンのハッシュを保存
  const urlToken = await generateUrlToken(data.id);
  const urlHash = await hashUrlToken(urlToken);
  await admin
    .from("agreements")
    .update({ url_hash: urlHash })
    .eq("id", data.id);

  return { agreementId: data.id, urlToken };
}

export async function acceptAgreement(id: string, userAgent: string) {
  const user = await getAuthUser();
  if (!user) return { error: "ログインが必要です" };

  const admin = createAdminClient();

  const { data: agreement, error: fetchError } = await admin
    .from("agreements")
    .select("status, creator_id")
    .eq("id", id)
    .single();

  if (fetchError || !agreement) {
    return { error: "お約束事が見つかりません" };
  }

  if (agreement.status !== "pending") {
    return { error: "このお約束事は既に処理済みです" };
  }

  if (agreement.creator_id === user.id) {
    return { error: "自分が作成したお約束事には合意できません" };
  }

  const req = await getRequestInfo();

  const [updateResult, logResult] = await Promise.all([
    admin.from("agreements").update({ status: "accepted" }).eq("id", id),
    admin.from("agreement_logs").insert({
      agreement_id: id,
      action_type: "accept",
      user_agent: userAgent,
      actor_id: user.id,
      actor_email: user.email,
      ip_address: req.ipAddress,
      ip_country: req.ipCountry,
      ip_region: req.ipRegion,
    }),
  ]);

  if (updateResult.error) {
    return { error: `合意の記録に失敗しました: ${updateResult.error.message}` };
  }
  if (logResult.error) {
    return { error: `ログの記録に失敗しました: ${logResult.error.message}` };
  }

  await notifyAgreementAction(id, "accept", user.id, user.email!);
  return { success: true };
}

export async function rejectAgreement(id: string, userAgent: string) {
  const user = await getAuthUser();
  if (!user) return { error: "ログインが必要です" };

  const admin = createAdminClient();

  const { data: agreement, error: fetchError } = await admin
    .from("agreements")
    .select("status, creator_id")
    .eq("id", id)
    .single();

  if (fetchError || !agreement) {
    return { error: "お約束事が見つかりません" };
  }

  if (agreement.status !== "pending") {
    return { error: "このお約束事は既に処理済みです" };
  }

  if (agreement.creator_id === user.id) {
    return { error: "自分が作成したお約束事は拒否できません" };
  }

  const req = await getRequestInfo();

  const [updateResult, logResult] = await Promise.all([
    admin.from("agreements").update({ status: "rejected" }).eq("id", id),
    admin.from("agreement_logs").insert({
      agreement_id: id,
      action_type: "reject",
      user_agent: userAgent,
      actor_id: user.id,
      actor_email: user.email,
      ip_address: req.ipAddress,
      ip_country: req.ipCountry,
      ip_region: req.ipRegion,
    }),
  ]);

  if (updateResult.error) {
    return { error: `拒否の記録に失敗しました: ${updateResult.error.message}` };
  }
  if (logResult.error) {
    return { error: `ログの記録に失敗しました: ${logResult.error.message}` };
  }

  await notifyAgreementAction(id, "reject", user.id, user.email!);
  return { success: true };
}

export async function withdrawAgreement(id: string, userAgent: string) {
  const user = await getAuthUser();
  if (!user) return { error: "ログインが必要です" };

  const admin = createAdminClient();

  const { data: agreement, error: fetchError } = await admin
    .from("agreements")
    .select("status, creator_id")
    .eq("id", id)
    .single();

  if (fetchError || !agreement) {
    return { error: "お約束事が見つかりません" };
  }

  if (agreement.creator_id !== user.id) {
    return { error: "作成者のみ取り下げ申請できます" };
  }

  if (agreement.status === "withdraw_pending") {
    return { error: "既に取り下げ申請中です" };
  }

  // 合意した相手がいるか確認
  const { data: acceptLog } = await admin
    .from("agreement_logs")
    .select("actor_id")
    .eq("agreement_id", id)
    .eq("action_type", "accept")
    .limit(1)
    .maybeSingle();

  // まだ誰も合意していないなら即削除
  if (!acceptLog) {
    const { error: deleteError, count } = await admin
      .from("agreements")
      .delete({ count: "exact" })
      .eq("id", id)
      .eq("creator_id", user.id);

    if (deleteError || count === 0) {
      return { error: "取り下げに失敗しました" };
    }
    return { success: true, deleted: true };
  }

  // 合意した相手がいる場合は承認を求める
  const req = await getRequestInfo();

  const [updateResult, logResult] = await Promise.all([
    admin
      .from("agreements")
      .update({ status: "withdraw_pending", previous_status: agreement.status })
      .eq("id", id),
    admin.from("agreement_logs").insert({
      agreement_id: id,
      action_type: "withdraw_request",
      user_agent: userAgent,
      actor_id: user.id,
      actor_email: user.email,
      ip_address: req.ipAddress,
      ip_country: req.ipCountry,
      ip_region: req.ipRegion,
    }),
  ]);

  if (updateResult.error) {
    return { error: `取り下げ申請に失敗しました: ${updateResult.error.message}` };
  }
  if (logResult.error) {
    return { error: `ログの記録に失敗しました: ${logResult.error.message}` };
  }

  await notifyAgreementAction(id, "withdraw_request", user.id, user.email!);
  return { success: true, deleted: false };
}

export async function approveWithdraw(id: string, userAgent: string) {
  const user = await getAuthUser();
  if (!user) return { error: "ログインが必要です" };

  const admin = createAdminClient();

  const { data: agreement, error: fetchError } = await admin
    .from("agreements")
    .select("status, creator_id")
    .eq("id", id)
    .single();

  if (fetchError || !agreement) {
    return { error: "お約束事が見つかりません" };
  }

  if (agreement.status !== "withdraw_pending") {
    return { error: "取り下げ申請中ではありません" };
  }

  if (agreement.creator_id === user.id) {
    return { error: "作成者自身は取り下げを承認できません" };
  }

  const req = await getRequestInfo();

  // ログを残してから削除（CASCADEでログも消えるが、承認の記録として先に入れる）
  await admin.from("agreement_logs").insert({
    agreement_id: id,
    action_type: "withdraw_approve",
    user_agent: userAgent,
    actor_id: user.id,
    actor_email: user.email,
    ip_address: req.ipAddress,
    ip_country: req.ipCountry,
    ip_region: req.ipRegion,
  });

  const { error: deleteError } = await admin
    .from("agreements")
    .delete()
    .eq("id", id);

  if (deleteError) {
    return { error: `削除に失敗しました: ${deleteError.message}` };
  }

  await notifyAgreementAction(id, "withdraw_approve", user.id, user.email!);
  return { success: true };
}

export async function rejectWithdraw(id: string, userAgent: string) {
  const user = await getAuthUser();
  if (!user) return { error: "ログインが必要です" };

  const admin = createAdminClient();

  const { data: agreement, error: fetchError } = await admin
    .from("agreements")
    .select("status, creator_id, previous_status")
    .eq("id", id)
    .single();

  if (fetchError || !agreement) {
    return { error: "お約束事が見つかりません" };
  }

  if (agreement.status !== "withdraw_pending") {
    return { error: "取り下げ申請中ではありません" };
  }

  if (agreement.creator_id === user.id) {
    return { error: "作成者自身は取り下げ拒否できません" };
  }

  const req = await getRequestInfo();

  const [updateResult, logResult] = await Promise.all([
    admin
      .from("agreements")
      .update({ status: agreement.previous_status ?? "accepted", previous_status: null })
      .eq("id", id),
    admin.from("agreement_logs").insert({
      agreement_id: id,
      action_type: "withdraw_reject",
      user_agent: userAgent,
      actor_id: user.id,
      actor_email: user.email,
      ip_address: req.ipAddress,
      ip_country: req.ipCountry,
      ip_region: req.ipRegion,
    }),
  ]);

  if (updateResult.error) {
    return { error: `拒否に失敗しました: ${updateResult.error.message}` };
  }
  if (logResult.error) {
    return { error: `ログの記録に失敗しました: ${logResult.error.message}` };
  }

  await notifyAgreementAction(id, "withdraw_reject", user.id, user.email!);
  return { success: true };
}

export async function rerequestAgreement(id: string, userAgent: string) {
  const user = await getAuthUser();
  if (!user) return { error: "ログインが必要です" };

  const admin = createAdminClient();

  const { data: agreement, error: fetchError } = await admin
    .from("agreements")
    .select("status, creator_id")
    .eq("id", id)
    .single();

  if (fetchError || !agreement) {
    return { error: "お約束事が見つかりません" };
  }

  if (agreement.creator_id !== user.id) {
    return { error: "作成者のみ再申請できます" };
  }

  if (agreement.status !== "rejected") {
    return { error: "拒否されたお約束事のみ再申請できます" };
  }

  const req = await getRequestInfo();

  const [updateResult, logResult] = await Promise.all([
    admin.from("agreements").update({ status: "pending" }).eq("id", id),
    admin.from("agreement_logs").insert({
      agreement_id: id,
      action_type: "rerequest",
      user_agent: userAgent,
      actor_id: user.id,
      actor_email: user.email,
      ip_address: req.ipAddress,
      ip_country: req.ipCountry,
      ip_region: req.ipRegion,
    }),
  ]);

  if (updateResult.error) {
    return { error: `再申請に失敗しました: ${updateResult.error.message}` };
  }
  if (logResult.error) {
    return { error: `ログの記録に失敗しました: ${logResult.error.message}` };
  }

  await notifyAgreementAction(id, "rerequest", user.id, user.email!);
  return { success: true };
}

export async function editAgreement(id: string, formData: FormData) {
  const user = await getAuthUser();
  if (!user) return { error: "ログインが必要です" };

  const admin = createAdminClient();

  const { data: agreement, error: fetchError } = await admin
    .from("agreements")
    .select("creator_id")
    .eq("id", id)
    .single();

  if (fetchError || !agreement) {
    return { error: "お約束事が見つかりません" };
  }

  if (agreement.creator_id !== user.id) {
    return { error: "作成者のみ編集できます" };
  }

  const title = formData.get("title") as string;
  const content = formData.get("content") as string;

  if (!title || !content) {
    return { error: "タイトルと内容を入力してください" };
  }

  const contentHash = await generateContentHash(content);
  const { encTitle, titleIv, encContent, contentIv } =
    await encryptAgreement(user.id, user.email!, title, content);
  const req = await getRequestInfo();

  const [updateResult, logResult] = await Promise.all([
    admin
      .from("agreements")
      .update({
        title: encTitle,
        content: encContent,
        content_hash: contentHash,
        status: "pending",
        title_iv: titleIv,
        content_iv: contentIv,
        is_encrypted: true,
      })
      .eq("id", id),
    admin.from("agreement_logs").insert({
      agreement_id: id,
      action_type: "edit",
      user_agent: null,
      actor_id: user.id,
      actor_email: user.email,
      ip_address: req.ipAddress,
      ip_country: req.ipCountry,
      ip_region: req.ipRegion,
    }),
  ]);

  if (updateResult.error) {
    return { error: `編集に失敗しました: ${updateResult.error.message}` };
  }
  if (logResult.error) {
    return { error: `ログの記録に失敗しました: ${logResult.error.message}` };
  }

  await notifyAgreementAction(id, "edit", user.id, user.email!);
  return { success: true };
}

export async function revokeAgreement(id: string, userAgent: string) {
  const user = await getAuthUser();
  if (!user) return { error: "ログインが必要です" };

  const admin = createAdminClient();

  const { data: agreement, error: fetchError } = await admin
    .from("agreements")
    .select("status, creator_id")
    .eq("id", id)
    .single();

  if (fetchError || !agreement) {
    return { error: "お約束事が見つかりません" };
  }

  if (agreement.status !== "accepted") {
    return { error: "合意済みのお約束事のみ解除申請できます" };
  }

  // 当事者チェック（合意した側のみ解除申請可能）
  const { data: acceptLog } = await admin
    .from("agreement_logs")
    .select("actor_id")
    .eq("agreement_id", id)
    .eq("action_type", "accept")
    .eq("actor_id", user.id)
    .limit(1)
    .maybeSingle();

  if (!acceptLog) {
    return { error: "このお約束事の当事者ではありません" };
  }

  const req = await getRequestInfo();

  const [updateResult, logResult] = await Promise.all([
    admin
      .from("agreements")
      .update({ status: "revoke_pending", previous_status: agreement.status })
      .eq("id", id),
    admin.from("agreement_logs").insert({
      agreement_id: id,
      action_type: "revoke_request",
      user_agent: userAgent,
      actor_id: user.id,
      actor_email: user.email,
      ip_address: req.ipAddress,
      ip_country: req.ipCountry,
      ip_region: req.ipRegion,
    }),
  ]);

  if (updateResult.error) {
    return { error: "解除申請に失敗しました" };
  }
  if (logResult.error) {
    return { error: "ログの記録に失敗しました" };
  }

  await notifyAgreementAction(id, "revoke_request", user.id, user.email!);
  return { success: true };
}

export async function approveRevoke(id: string, userAgent: string) {
  const user = await getAuthUser();
  if (!user) return { error: "ログインが必要です" };

  const admin = createAdminClient();

  const { data: agreement, error: fetchError } = await admin
    .from("agreements")
    .select("status, creator_id")
    .eq("id", id)
    .single();

  if (fetchError || !agreement) {
    return { error: "お約束事が見つかりません" };
  }

  if (agreement.status !== "revoke_pending") {
    return { error: "解除申請中ではありません" };
  }

  if (agreement.creator_id !== user.id) {
    return { error: "作成者のみ解除を承認できます" };
  }

  const req = await getRequestInfo();

  await admin.from("agreement_logs").insert({
    agreement_id: id,
    action_type: "revoke_approve",
    user_agent: userAgent,
    actor_id: user.id,
    actor_email: user.email,
    ip_address: req.ipAddress,
    ip_country: req.ipCountry,
    ip_region: req.ipRegion,
  });

  const { error: deleteError } = await admin
    .from("agreements")
    .delete()
    .eq("id", id);

  if (deleteError) {
    return { error: `削除に失敗しました: ${deleteError.message}` };
  }

  await notifyAgreementAction(id, "revoke_approve", user.id, user.email!);
  return { success: true };
}

export async function rejectRevoke(id: string, userAgent: string) {
  const user = await getAuthUser();
  if (!user) return { error: "ログインが必要です" };

  const admin = createAdminClient();

  const { data: agreement, error: fetchError } = await admin
    .from("agreements")
    .select("status, creator_id, previous_status")
    .eq("id", id)
    .single();

  if (fetchError || !agreement) {
    return { error: "お約束事が見つかりません" };
  }

  if (agreement.status !== "revoke_pending") {
    return { error: "解除申請中ではありません" };
  }

  if (agreement.creator_id !== user.id) {
    return { error: "作成者のみ解除を拒否できます" };
  }

  const req = await getRequestInfo();

  const [updateResult, logResult] = await Promise.all([
    admin
      .from("agreements")
      .update({ status: agreement.previous_status ?? "accepted", previous_status: null })
      .eq("id", id),
    admin.from("agreement_logs").insert({
      agreement_id: id,
      action_type: "revoke_reject",
      user_agent: userAgent,
      actor_id: user.id,
      actor_email: user.email,
      ip_address: req.ipAddress,
      ip_country: req.ipCountry,
      ip_region: req.ipRegion,
    }),
  ]);

  if (updateResult.error) {
    return { error: `拒否に失敗しました: ${updateResult.error.message}` };
  }
  if (logResult.error) {
    return { error: `ログの記録に失敗しました: ${logResult.error.message}` };
  }

  await notifyAgreementAction(id, "revoke_reject", user.id, user.email!);
  return { success: true };
}
