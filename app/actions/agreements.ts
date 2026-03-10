"use server";

import { createClient } from "@/lib/supabase/server";
import { generateContentHash } from "@/lib/agreements";

export async function createAgreement(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "login_required" };
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
    return { error: "お約束事の作成に失敗しました" };
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

  const { data: agreement, error: fetchError } = await supabase
    .from("agreements")
    .select("status, target_email, creator_id")
    .eq("id", id)
    .single();

  if (fetchError || !agreement) {
    return { error: "お約束事が見つかりません" };
  }

  if (agreement.status !== "pending") {
    return { error: "このお約束事は既に処理済みです" };
  }

  if (agreement.target_email !== null) {
    if (agreement.target_email !== user.email) {
      return { error: "このお約束事の対象者ではありません" };
    }
  } else {
    if (agreement.creator_id === user.id) {
      return { error: "自分が作成したお約束事には合意できません" };
    }
  }

  const [updateResult, logResult] = await Promise.all([
    supabase.from("agreements").update({ status: "accepted" }).eq("id", id),
    supabase.from("agreement_logs").insert({
      agreement_id: id,
      action_type: "accept",
      user_agent: userAgent,
      actor_id: user.id,
      actor_email: user.email,
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
    return { error: "お約束事が見つかりません" };
  }

  if (agreement.status !== "pending") {
    return { error: "このお約束事は既に処理済みです" };
  }

  if (agreement.target_email !== null) {
    if (agreement.target_email !== user.email) {
      return { error: "このお約束事の対象者ではありません" };
    }
  } else {
    if (agreement.creator_id === user.id) {
      return { error: "自分が作成したお約束事は拒否できません" };
    }
  }

  const [updateResult, logResult] = await Promise.all([
    supabase.from("agreements").update({ status: "rejected" }).eq("id", id),
    supabase.from("agreement_logs").insert({
      agreement_id: id,
      action_type: "reject",
      user_agent: userAgent,
      actor_id: user.id,
      actor_email: user.email,
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

  const { error: deleteError, count } = await supabase
    .from("agreements")
    .delete({ count: "exact" })
    .eq("id", id)
    .eq("creator_id", user.id);

  if (deleteError) {
    return { error: `取り下げに失敗しました: ${deleteError.message}` };
  }

  if (count === 0) {
    return { error: "お約束事が見つからないか、作成者ではありません" };
  }

  return { success: true };
}

export async function rerequestAgreement(id: string, userAgent: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "ログインが必要です" };
  }

  const { data: agreement, error: fetchError } = await supabase
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

  const [updateResult, logResult] = await Promise.all([
    supabase.from("agreements").update({ status: "pending" }).eq("id", id),
    supabase.from("agreement_logs").insert({
      agreement_id: id,
      action_type: "rerequest",
      user_agent: userAgent,
      actor_id: user.id,
      actor_email: user.email,
    }),
  ]);

  if (updateResult.error) {
    return { error: `再申請に失敗しました: ${updateResult.error.message}` };
  }
  if (logResult.error) {
    return { error: `ログの記録に失敗しました: ${logResult.error.message}` };
  }

  return { success: true };
}

export async function editAgreement(id: string, formData: FormData) {
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

  const [updateResult, logResult] = await Promise.all([
    supabase
      .from("agreements")
      .update({
        title,
        content,
        content_hash: contentHash,
        status: "pending",
      })
      .eq("id", id),
    supabase.from("agreement_logs").insert({
      agreement_id: id,
      action_type: "edit",
      user_agent: null,
      actor_id: user.id,
      actor_email: user.email,
    }),
  ]);

  if (updateResult.error) {
    return { error: `編集に失敗しました: ${updateResult.error.message}` };
  }
  if (logResult.error) {
    return { error: `ログの記録に失敗しました: ${logResult.error.message}` };
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
    return { error: "お約束事が見つかりません" };
  }

  if (agreement.status !== "accepted") {
    return { error: "合意済みのお約束事のみ解除できます" };
  }

  const isTarget =
    agreement.target_email !== null &&
    agreement.target_email === user.email;

  if (!isTarget) {
    const { data: acceptLog } = await supabase
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
  }

  const [updateResult, logResult] = await Promise.all([
    supabase.from("agreements").update({ status: "revoked" }).eq("id", id),
    supabase.from("agreement_logs").insert({
      agreement_id: id,
      action_type: "revoke",
      user_agent: userAgent,
      actor_id: user.id,
      actor_email: user.email,
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
