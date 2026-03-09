"use server";

import { createClient } from "@/lib/supabase/server";
import { generateContentHash } from "@/lib/agreements";
import { redirect } from "next/navigation";

export async function createAgreement(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?redirect=/protected/agreements/new");
  }

  const title = formData.get("title") as string;
  const content = formData.get("content") as string;

  if (!title || !content) {
    return { error: "タイトルと内容を入力してください" };
  }

  const contentHash = await generateContentHash(content);

  const { data, error } = await supabase
    .from("agreements")
    .insert({
      title,
      content,
      content_hash: contentHash,
      creator_id: user.id,
      creator_email: user.email!,
      target_email: null,
    })
    .select("id")
    .single();

  if (error) {
    return { error: "同意書の作成に失敗しました" };
  }

  return { agreementId: data.id };
}

export async function acceptAgreement(id: string, userAgent: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "ログインが必要です" };
  }

  // ステータス確認 & 権限チェック
  const { data: agreement, error: fetchError } = await supabase
    .from("agreements")
    .select("status, target_email, creator_id")
    .eq("id", id)
    .single();

  if (fetchError || !agreement) {
    return { error: "同意書が見つかりません" };
  }

  if (agreement.status !== "pending") {
    return { error: "この同意書は既に処理済みです" };
  }

  if (agreement.target_email !== null) {
    if (agreement.target_email !== user.email) {
      return { error: "この同意書の対象者ではありません" };
    }
  } else {
    if (agreement.creator_id === user.id) {
      return { error: "自分が作成した同意書には合意できません" };
    }
  }

  // ステータス更新とログ記録を並列実行
  const [updateResult, logResult] = await Promise.all([
    supabase.from("agreements").update({ status: "accepted" }).eq("id", id),
    supabase.from("agreement_logs").insert({
      agreement_id: id,
      action_type: "accept",
      user_agent: userAgent,
      actor_id: user.id,
    }),
  ]);

  if (updateResult.error) {
    return { error: `合意の記録に失敗しました: ${updateResult.error.message}` };
  }
  if (logResult.error) {
    return { error: `ログの記録に失敗しました: ${logResult.error.message}` };
  }

  return { success: true };
}

export async function rejectAgreement(id: string, userAgent: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "ログインが必要です" };
  }

  const { data: agreement, error: fetchError } = await supabase
    .from("agreements")
    .select("status, creator_id, target_email")
    .eq("id", id)
    .single();

  if (fetchError || !agreement) {
    return { error: "同意書が見つかりません" };
  }

  if (agreement.status !== "pending") {
    return { error: "この同意書は既に処理済みです" };
  }

  if (agreement.target_email !== null) {
    if (agreement.target_email !== user.email) {
      return { error: "この同意書の対象者ではありません" };
    }
  } else {
    if (agreement.creator_id === user.id) {
      return { error: "自分が作成した同意書は拒否できません" };
    }
  }

  // ステータス更新とログ記録を並列実行
  const [updateResult, logResult] = await Promise.all([
    supabase.from("agreements").update({ status: "rejected" }).eq("id", id),
    supabase.from("agreement_logs").insert({
      agreement_id: id,
      action_type: "reject",
      user_agent: userAgent,
      actor_id: user.id,
    }),
  ]);

  if (updateResult.error) {
    return { error: `拒否の記録に失敗しました: ${updateResult.error.message}` };
  }
  if (logResult.error) {
    return { error: `ログの記録に失敗しました: ${logResult.error.message}` };
  }

  return { success: true };
}

export async function withdrawAgreement(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "ログインが必要です" };
  }

  // RLS で creator_id = auth.uid() のみ削除可能
  // agreement_logs は ON DELETE CASCADE で自動削除
  const { error: deleteError, count } = await supabase
    .from("agreements")
    .delete({ count: "exact" })
    .eq("id", id)
    .eq("creator_id", user.id);

  if (deleteError) {
    return { error: `取り下げに失敗しました: ${deleteError.message}` };
  }

  if (count === 0) {
    return { error: "同意書が見つからないか、作成者ではありません" };
  }

  return { success: true };
}

export async function revokeAgreement(id: string, userAgent: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "ログインが必要です" };
  }

  const { data: agreement, error: fetchError } = await supabase
    .from("agreements")
    .select("status, creator_id, target_email")
    .eq("id", id)
    .single();

  if (fetchError || !agreement) {
    return { error: "同意書が見つかりません" };
  }

  if (agreement.status !== "accepted") {
    return { error: "合意済みの同意書のみ解除できます" };
  }

  const isTarget =
    agreement.target_email !== null &&
    agreement.target_email === user.email;

  if (!isTarget) {
    // accept ログの actor かチェック
    const { data: acceptLog } = await supabase
      .from("agreement_logs")
      .select("actor_id")
      .eq("agreement_id", id)
      .eq("action_type", "accept")
      .eq("actor_id", user.id)
      .limit(1)
      .maybeSingle();

    if (!acceptLog) {
      return { error: "この同意書の当事者ではありません" };
    }
  }

  // ステータス更新とログ記録を並列実行
  const [updateResult, logResult] = await Promise.all([
    supabase.from("agreements").update({ status: "revoked" }).eq("id", id),
    supabase.from("agreement_logs").insert({
      agreement_id: id,
      action_type: "revoke",
      user_agent: userAgent,
      actor_id: user.id,
    }),
  ]);

  if (updateResult.error) {
    return { error: "合意解除に失敗しました" };
  }
  if (logResult.error) {
    return { error: "ログの記録に失敗しました" };
  }

  return { success: true };
}
