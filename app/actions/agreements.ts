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

  // 現在のステータスを確認
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

  // target_email が設定されている場合はそのメールのユーザーのみ、null なら creator 以外の誰でも
  if (agreement.target_email !== null) {
    if (agreement.target_email !== user.email) {
      return { error: "この同意書の対象者ではありません" };
    }
  } else {
    if (agreement.creator_id === user.id) {
      return { error: "自分が作成した同意書には合意できません" };
    }
  }

  // ステータス更新
  const { error: updateError } = await supabase
    .from("agreements")
    .update({ status: "accepted" })
    .eq("id", id);

  if (updateError) {
    return { error: `合意の記録に失敗しました: ${updateError.message}` };
  }

  // ログ記録
  const { error: logError } = await supabase.from("agreement_logs").insert({
    agreement_id: id,
    action_type: "accept",
    user_agent: userAgent,
    actor_id: user.id,
  });

  if (logError) {
    return { error: `ログの記録に失敗しました: ${logError.message}` };
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

  // accept と同じ権限チェック
  if (agreement.target_email !== null) {
    if (agreement.target_email !== user.email) {
      return { error: "この同意書の対象者ではありません" };
    }
  } else {
    if (agreement.creator_id === user.id) {
      return { error: "自分が作成した同意書は拒否できません" };
    }
  }

  const { error: updateError } = await supabase
    .from("agreements")
    .update({ status: "rejected" })
    .eq("id", id);

  if (updateError) {
    return { error: `拒否の記録に失敗しました: ${updateError.message}` };
  }

  const { error: logError } = await supabase.from("agreement_logs").insert({
    agreement_id: id,
    action_type: "reject",
    user_agent: userAgent,
    actor_id: user.id,
  });

  if (logError) {
    return { error: `ログの記録に失敗しました: ${logError.message}` };
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

  const { data: agreement, error: fetchError } = await supabase
    .from("agreements")
    .select("creator_id")
    .eq("id", id)
    .single();

  if (fetchError || !agreement) {
    return { error: "同意書が見つかりません" };
  }

  if (agreement.creator_id !== user.id) {
    return { error: "作成者のみ取り下げできます" };
  }

  // agreement_logs は ON DELETE CASCADE で自動削除される
  const { error: deleteError } = await supabase
    .from("agreements")
    .delete()
    .eq("id", id);

  if (deleteError) {
    return { error: `取り下げに失敗しました: ${deleteError.message}` };
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

  // 当事者チェック
  const isCreator = agreement.creator_id === user.id;
  const isTarget = agreement.target_email !== null && agreement.target_email === user.email;

  // target_email が null の場合、accept ログの actor も当事者とみなす
  let isAcceptor = false;
  if (!isCreator && !isTarget && agreement.target_email === null) {
    const { data: acceptLog } = await supabase
      .from("agreement_logs")
      .select("actor_id")
      .eq("agreement_id", id)
      .eq("action_type", "accept")
      .limit(1)
      .single();
    isAcceptor = acceptLog?.actor_id === user.id;
  }

  if (!isCreator && !isTarget && !isAcceptor) {
    return { error: "この同意書の当事者ではありません" };
  }

  const { error: updateError } = await supabase
    .from("agreements")
    .update({ status: "revoked" })
    .eq("id", id);

  if (updateError) {
    return { error: "合意解除に失敗しました" };
  }

  const { error: logError } = await supabase.from("agreement_logs").insert({
    agreement_id: id,
    action_type: "revoke",
    user_agent: userAgent,
    actor_id: user.id,
  });

  if (logError) {
    return { error: "ログの記録に失敗しました" };
  }

  return { success: true };
}
